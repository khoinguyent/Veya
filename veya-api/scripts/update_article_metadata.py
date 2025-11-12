#!/usr/bin/env python3
"""
Script to update article block metadata for paged blocks.
Updates the 'gentle-breathing-ladder' article with proper metadata.
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlmodel import Session, select
from app.db.database import engine
from app.models.library import LibraryArticle, LibraryArticleBlock


def update_gentle_breathing_ladder():
    """Update metadata for Gentle Breathing Ladder article blocks."""
    with Session(engine) as session:
        # Find the article
        article = session.exec(
            select(LibraryArticle).where(LibraryArticle.slug == "gentle-breathing-ladder")
        ).first()

        if not article:
            print("❌ Article 'gentle-breathing-ladder' not found")
            return

        print(f"✅ Found article: {article.title} (ID: {article.id})")

        # Set presentation style to paged_blocks
        article.presentation_style = "paged_blocks"
        article.presentation_config = {
            "pageBackground": "#DDE8F8",
            "pagePadding": 20,
            "pageVerticalPadding": 40,
            "tapThreshold": 0.4,
            "defaultPadding": 32,
            "defaultAlign": "center",
            "defaultBlockBackground": "rgba(255,255,255,0.95)",
        }
        print("✅ Updated article presentation_style to 'paged_blocks'")

        # Get all blocks for this article
        blocks = session.exec(
            select(LibraryArticleBlock)
            .where(LibraryArticleBlock.article_id == article.id)
            .order_by(LibraryArticleBlock.position)
        ).all()

        print(f"✅ Found {len(blocks)} blocks")

        # Define metadata for each block based on position
        block_metadata = {
            1: {  # Hero block
                "pageBackground": "#FFF5E6",
                "backgroundColor": "rgba(255,245,230,0.95)",
                "titleColor": "#2F3F4A",
                "subtitleColor": "rgba(47, 63, 74, 0.72)",
                "padding": 32,
                "align": "center",
                "justify": "flex-start",
                "textAlign": "center",
            },
            2: {  # Inhale & Rise
                "pageBackground": "#E8F4F8",
                "backgroundColor": "rgba(255,255,255,0.95)",
                "textColor": "#2F3F4A",
                "headingColor": "#1A1A1A",
                "textAlign": "center",
                "padding": 32,
                "paddingVertical": 40,
                "paddingHorizontal": 28,
                "align": "center",
                "justify": "center",
                "fontSize": 18,
            },
            3: {  # Pause & Notice
                "pageBackground": "#F0F8F0",
                "backgroundColor": "rgba(255,255,255,0.95)",
                "textColor": "#2F3F4A",
                "headingColor": "#1A1A1A",
                "textAlign": "center",
                "padding": 32,
                "paddingVertical": 40,
                "paddingHorizontal": 28,
                "align": "center",
                "justify": "center",
                "fontSize": 18,
            },
            4: {  # Illustration
                "pageBackground": "#F8F0E8",
                "backgroundColor": "transparent",
                "padding": 24,
                "align": "center",
                "justify": "center",
                "borderRadius": 24,
                "resizeMode": "contain",
                "height": 400,
            },
            5: {  # Exhale & Descend
                "pageBackground": "#E8F4F8",
                "backgroundColor": "rgba(255,255,255,0.95)",
                "textColor": "#2F3F4A",
                "headingColor": "#1A1A1A",
                "textAlign": "center",
                "padding": 32,
                "paddingVertical": 40,
                "paddingHorizontal": 28,
                "align": "center",
                "justify": "center",
                "fontSize": 18,
            },
            6: {  # Quote
                "pageBackground": "#FFF0F5",
                "backgroundColor": "rgba(255,255,255,0.95)",
                "textColor": "#2F3F4A",
                "textAlign": "center",
                "padding": 32,
                "paddingVertical": 40,
                "paddingHorizontal": 28,
                "align": "center",
                "justify": "center",
                "fontSize": 20,
                "fontStyle": "italic",
            },
            7: {  # Integration
                "pageBackground": "#DDE8F8",
                "backgroundColor": "rgba(255,255,255,0.95)",
                "textColor": "#2F3F4A",
                "headingColor": "#1A1A1A",
                "textAlign": "center",
                "padding": 32,
                "paddingVertical": 40,
                "paddingHorizontal": 28,
                "align": "center",
                "justify": "center",
                "fontSize": 18,
            },
        }

        # Update each block's metadata
        updated_count = 0
        for block in blocks:
            if block.position in block_metadata:
                # Merge existing metadata with new metadata
                existing_metadata = block.metadata_ or {}
                new_metadata = block_metadata[block.position]
                block.metadata_ = {**existing_metadata, **new_metadata}
                updated_count += 1
                print(
                    f"  ✅ Updated block {block.position} ({block.block_type}): {list(new_metadata.keys())}"
                )

        session.add(article)
        for block in blocks:
            session.add(block)

        session.commit()
        print(f"\n✅ Successfully updated {updated_count} blocks and article metadata")
        print(f"✅ Article presentation_style: {article.presentation_style}")


if __name__ == "__main__":
    try:
        update_gentle_breathing_ladder()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)

