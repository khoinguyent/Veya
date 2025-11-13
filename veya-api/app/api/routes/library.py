from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
import sqlalchemy as sa
from sqlalchemy import func, text, exists, or_, literal_column

from app.db.database import get_session
from app.models.library import LibraryNode, LibraryArticle, LibraryArticleBlock
from app.schemas.library import (
    LibraryCategoryTreeResponse,
    LibraryTopicSummaryResponse,
    LibraryTopicDetailResponse,
    LibraryArticleSummaryResponse,
    LibraryArticleDetailResponse,
    LibraryArticleBlockResponse,
    LibrarySearchResponse,
    LibrarySearchHit,
)

router = APIRouter(prefix="/library", tags=["library"])


def _node_to_category_response(node: LibraryNode) -> LibraryCategoryTreeResponse:
    return LibraryCategoryTreeResponse(
        id=node.id,
        slug=node.slug,
        title=node.title,
        summary=node.summary,
        description=node.description,
        node_type=node.node_type,
        accent_color=node.accent_color,
        icon=node.icon,
        cover_image_url=node.cover_image_url,
        order_index=node.order_index,
        is_active=node.is_active,
        tags=list(node.tags or []),
        metadata=dict(node.metadata_ or {}),
        children=[],
    )


def _build_category_tree(nodes: List[LibraryNode]) -> List[LibraryCategoryTreeResponse]:
    nodes_by_id: dict[UUID, LibraryNode] = {node.id: node for node in nodes}
    node_map: dict[UUID, LibraryCategoryTreeResponse] = {
        node.id: _node_to_category_response(node) for node in nodes
    }

    for node in nodes:
        parent_id = node.parent_id
        if parent_id and parent_id in node_map:
            node_map[parent_id].children.append(node_map[node.id])

    def sort_children(items: List[LibraryCategoryTreeResponse]) -> None:
        items.sort(key=lambda child: child.order_index)
        for child in items:
            sort_children(child.children)

    roots = [resp for node_id, resp in node_map.items() if nodes_by_id[node_id].parent_id is None]
    sort_children(roots)
    return [root for root in roots if root.node_type == "category"]


def _accent_color(node: LibraryNode, nodes_by_id: dict[UUID, LibraryNode]) -> Optional[str]:
    if node.accent_color:
        return node.accent_color
    if node.parent_id and node.parent_id in nodes_by_id:
        return _accent_color(nodes_by_id[node.parent_id], nodes_by_id)
    return None


def _include_ancestors(
    session: Session,
    node: Optional[LibraryNode],
    nodes_by_id: dict[UUID, LibraryNode],
) -> None:
    current = node
    while current and current.parent_id:
        parent = nodes_by_id.get(current.parent_id)
        if not parent:
            parent = session.get(LibraryNode, current.parent_id)
            if not parent:
                break
            nodes_by_id[parent.id] = parent
        current = parent


def _library_articles_has_node_id(session: Session) -> bool:
    cache_key = "library_articles_has_node_id"
    cached = session.info.get(cache_key)
    if cached is not None:
        return cached

    bind = session.get_bind()
    has_column = False
    if bind is not None:
        inspector = sa.inspect(bind)
        try:
            columns = inspector.get_columns("library_articles")
        except sa.exc.NoSuchTableError:
            columns = []
        has_column = any(column["name"] == "node_id" for column in columns)

    session.info[cache_key] = has_column
    return has_column


def _topic_summary(
    session: Session,
    node: LibraryNode,
    nodes_by_id: dict[UUID, LibraryNode],
) -> LibraryTopicSummaryResponse:
    article_count = 0
    if _library_articles_has_node_id(session):
        article_stmt = select(LibraryArticle.id).where(LibraryArticle.node_id == node.id)
        article_count = len(session.exec(article_stmt).all())

    return LibraryTopicSummaryResponse(
        id=node.id,
        slug=node.slug,
        title=node.title,
        summary=node.summary,
        cover_image_url=node.cover_image_url,
        order_index=node.order_index,
        article_count=int(article_count),
        tags=list(node.tags or []),
        accent_color=_accent_color(node, nodes_by_id),
        is_active=node.is_active,
        node_type=node.node_type,
    )


def _article_summary(article: LibraryArticle) -> LibraryArticleSummaryResponse:
    return LibraryArticleSummaryResponse(
        id=article.id,
        node_id=article.node_id,
        slug=article.slug,
        title=article.title,
        subtitle=article.subtitle,
        hero_image_url=article.hero_image_url,
        content_type=article.content_type,
        layout_variant=article.layout_variant,
        presentation_style=article.presentation_style,
        presentation_config=dict(article.presentation_config or {}),
        reading_time_minutes=article.reading_time_minutes,
        duration_seconds=article.duration_seconds,
        tags=list(article.tags or []),
        is_published=article.is_published,
        published_at=article.published_at,
        metadata=dict(article.metadata_ or {}),
    )


@router.get("/categories", response_model=List[LibraryCategoryTreeResponse])
def list_categories(session: Session = Depends(get_session)) -> List[LibraryCategoryTreeResponse]:
    nodes = session.exec(
        select(LibraryNode)
        .where(LibraryNode.is_active == True)  # noqa: E712
        .order_by(LibraryNode.order_index, LibraryNode.title)
    ).all()
    return _build_category_tree(nodes)


def _get_node_or_404(session: Session, slug: str) -> LibraryNode:
    node = session.exec(
        select(LibraryNode).where(LibraryNode.slug == slug, LibraryNode.is_active == True)  # noqa: E712
    ).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    return node


@router.get("/categories/{slug}/topics", response_model=List[LibraryTopicSummaryResponse])
def list_topics_for_category(
    slug: str,
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    session: Session = Depends(get_session),
) -> List[LibraryTopicSummaryResponse]:
    category = _get_node_or_404(session, slug)
    children = session.exec(
        select(LibraryNode)
        .where(
            LibraryNode.parent_id == category.id,
            LibraryNode.is_active == True,  # noqa: E712
        )
        .order_by(LibraryNode.order_index, LibraryNode.title)
        .offset(offset)
        .limit(limit)
    ).all()
    nodes_by_id = {node.id: node for node in children}
    nodes_by_id[category.id] = category
    _include_ancestors(session, category, nodes_by_id)

    return [_topic_summary(session, child, nodes_by_id) for child in children]


@router.get("/topics", response_model=List[LibraryTopicSummaryResponse])
def list_topics(
    parent_id: Optional[UUID] = Query(None),
    parent_slug: Optional[str] = Query(None),
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    session: Session = Depends(get_session),
) -> List[LibraryTopicSummaryResponse]:
    parent: Optional[LibraryNode] = None
    if parent_slug:
        parent = _get_node_or_404(session, parent_slug)
        parent_id = parent.id
    elif parent_id:
        parent = session.get(LibraryNode, parent_id)

    query = (
        select(LibraryNode)
        .where(LibraryNode.is_active == True)  # noqa: E712
        .order_by(LibraryNode.order_index, LibraryNode.title)
    )
    if parent_id:
        query = query.where(LibraryNode.parent_id == parent_id)
    else:
        query = query.where(LibraryNode.parent_id.isnot(None))

    nodes = session.exec(query.offset(offset).limit(limit)).all()
    nodes_by_id = {node.id: node for node in nodes}
    if parent:
        nodes_by_id[parent.id] = parent
        _include_ancestors(session, parent, nodes_by_id)

    return [_topic_summary(session, node, nodes_by_id) for node in nodes]


@router.get("/topics/{slug}", response_model=LibraryTopicDetailResponse)
def get_topic_detail(slug: str, session: Session = Depends(get_session)) -> LibraryTopicDetailResponse:
    node = _get_node_or_404(session, slug)
    parent = session.get(LibraryNode, node.parent_id) if node.parent_id else None

    articles = session.exec(
        select(LibraryArticle)
        .where(
            LibraryArticle.node_id == node.id,
            LibraryArticle.is_published == True,  # noqa: E712
        )
        .order_by(
            LibraryArticle.published_at.desc().nullslast(),
            LibraryArticle.created_at.desc(),
        )
    ).all()

    nodes_by_id = {node.id: node}
    if parent:
        nodes_by_id[parent.id] = parent
    _include_ancestors(session, node, nodes_by_id)

    parent_summary = _topic_summary(session, parent, nodes_by_id) if parent else None
    category_response = (
        _node_to_category_response(parent)
        if parent and parent.node_type == "category"
        else None
    )

    return LibraryTopicDetailResponse(
        id=node.id,
        slug=node.slug,
        title=node.title,
        summary=node.summary,
        cover_image_url=node.cover_image_url,
        tags=list(node.tags or []),
        metadata=dict(node.metadata_ or {}),
        node_type=node.node_type,
        category=category_response,
        parent=parent_summary,
        articles=[_article_summary(article) for article in articles],
    )


@router.get("/articles/{slug}", response_model=LibraryArticleDetailResponse)
def get_article_detail(slug: str, session: Session = Depends(get_session)) -> LibraryArticleDetailResponse:
    article = session.exec(select(LibraryArticle).where(LibraryArticle.slug == slug)).first()
    if not article or not article.is_published:
        raise HTTPException(status_code=404, detail="Article not found")

    node = session.get(LibraryNode, article.node_id) if article.node_id else None
    
    # Query blocks using raw SQL to include metadata column
    # SQLModel/SQLAlchemy has issues with reserved keyword 'metadata' column
    # Use raw SQL to explicitly select all columns including metadata
    blocks_query = text("""
        SELECT id, article_id, position, block_type, payload, metadata, created_at
        FROM library_article_blocks
        WHERE article_id = :article_id
        ORDER BY position
    """)
    
    # Execute raw SQL query and map results
    conn = session.connection()
    result = conn.execute(blocks_query, {"article_id": str(article.id)})
    
    # Fetch all rows (SQLAlchemy 2.0 returns Result object)
    blocks_data = list(result)
    
    # Map raw SQL results to block objects with metadata
    blocks_with_metadata = []
    for row in blocks_data:
        # row is a Row object, access by index
        metadata_value = row[5] if row[5] is not None else {}
        block_dict = {
            "id": row[0],
            "article_id": row[1],
            "position": row[2],
            "block_type": row[3],
            "payload": row[4] if row[4] is not None else {},
            "metadata_": metadata_value,  # This is the metadata JSONB column
            "created_at": row[6],
        }
        blocks_with_metadata.append(block_dict)

    nodes_by_id = {}
    if node:
        nodes_by_id[node.id] = node
        _include_ancestors(session, node, nodes_by_id)

    return LibraryArticleDetailResponse(
        id=article.id,
        slug=article.slug,
        title=article.title,
        subtitle=article.subtitle,
        hero_image_url=article.hero_image_url,
        hero_video_url=article.hero_video_url,
        audio_url=article.audio_url,
        transcript_url=article.transcript_url,
        content_locale=article.content_locale,
        content_type=article.content_type,
        layout_variant=article.layout_variant,
        presentation_style=article.presentation_style,
        presentation_config=dict(article.presentation_config or {}),
        reading_time_minutes=article.reading_time_minutes,
        duration_seconds=article.duration_seconds,
        tags=list(article.tags or []),
        is_published=article.is_published,
        published_at=article.published_at,
        metadata=dict(article.metadata_ or {}),
        topic=_topic_summary(session, node, nodes_by_id) if node else None,
        blocks=[
            LibraryArticleBlockResponse(
                position=block_dict["position"],
                block_type=block_dict["block_type"],
                payload=dict(block_dict["payload"] or {}),
                metadata=dict(block_dict["metadata_"] or {}),
            )
            for block_dict in blocks_with_metadata
        ],
    )


@router.get("/search", response_model=LibrarySearchResponse)
def search_library(
    query: str = Query(..., min_length=2, description="Search term"),
    session: Session = Depends(get_session),
) -> LibrarySearchResponse:
    """
    Search library content (topics and articles) by title, summary, description, and tags.
    Supports case-insensitive text search and JSONB array tag matching.
    """
    pattern = f"%{query.lower()}%"
    
    # Use raw SQL to get IDs that match search criteria (including tags)
    # Then load full objects using SQLAlchemy ORM for proper model mapping
    nodes_id_query = text("""
        SELECT DISTINCT ln.id
        FROM library_nodes ln
        WHERE ln.is_active = true
        AND (
            LOWER(ln.title) LIKE :pattern
            OR LOWER(COALESCE(ln.summary, '')) LIKE :pattern
            OR LOWER(COALESCE(ln.description, '')) LIKE :pattern
            OR LOWER(CAST(COALESCE(ln.metadata, '{}') AS TEXT)) LIKE :pattern
            OR EXISTS (
                SELECT 1
                FROM jsonb_array_elements_text(ln.tags) AS tag
                WHERE LOWER(tag::text) LIKE :pattern
            )
        )
        LIMIT 40
    """)
    
    articles_id_query = text("""
        SELECT DISTINCT la.id
        FROM library_articles la
        WHERE la.is_published = true
        AND (
            LOWER(la.title) LIKE :pattern
            OR LOWER(COALESCE(la.subtitle, '')) LIKE :pattern
            OR LOWER(CAST(COALESCE(la.metadata, '{}') AS TEXT)) LIKE :pattern
            OR EXISTS (
                SELECT 1
                FROM jsonb_array_elements_text(la.tags) AS tag
                WHERE LOWER(tag::text) LIKE :pattern
            )
        )
        LIMIT 20
    """)
    
    # Execute raw SQL queries to get matching IDs
    conn = session.connection()
    
    # Get node IDs
    nodes_id_result = conn.execute(nodes_id_query, {"pattern": pattern})
    node_ids = [UUID(str(row[0])) for row in nodes_id_result.fetchall()]
    
    # Get article IDs
    articles_id_result = conn.execute(articles_id_query, {"pattern": pattern})
    article_ids = [UUID(str(row[0])) for row in articles_id_result.fetchall()]
    
    # Load full objects using SQLAlchemy ORM
    if node_ids:
        nodes = session.exec(
            select(LibraryNode).where(LibraryNode.id.in_(node_ids))
        ).all()
    else:
        nodes = []
    
    if article_ids:
        articles = session.exec(
            select(LibraryArticle).where(LibraryArticle.id.in_(article_ids))
        ).all()
    else:
        articles = []

    nodes_by_id = {node.id: node for node in nodes}
    for article in articles:
        if article.node_id and article.node_id not in nodes_by_id:
            parent_node = session.get(LibraryNode, article.node_id)
            if parent_node:
                nodes_by_id[parent_node.id] = parent_node
                nodes.append(parent_node)

    for node in list(nodes_by_id.values()):
        _include_ancestors(session, node, nodes_by_id)

    categories = _build_category_tree(list(nodes_by_id.values()))
    topic_summaries = {
        node.id: _topic_summary(session, node, nodes_by_id)
        for node in nodes_by_id.values()
        if node.node_type != "category"
    }
    topics = list(topic_summaries.values())
    topics.sort(key=lambda item: item.order_index)

    hits: List[LibrarySearchHit] = []
    for node in nodes_by_id.values():
        hits.append(
            LibrarySearchHit(
                type="node",
                id=node.id,
                slug=node.slug,
                title=node.title,
                context=node.summary or node.description,
                accent_color=_accent_color(node, nodes_by_id),
                cover_image_url=node.cover_image_url,
                node_type=node.node_type,
            )
        )

    for article in articles:
        hits.append(
            LibrarySearchHit(
                type="article",
                id=article.id,
                slug=article.slug,
                title=article.title,
                subtitle=article.subtitle,
                cover_image_url=article.hero_image_url,
                node_type="article",
            )
        )

    return LibrarySearchResponse(
        query=query,
        categories=categories,
        topics=topics,
        articles=[_article_summary(article) for article in articles],
        hits=hits,
    )
