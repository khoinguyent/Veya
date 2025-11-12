"""
Legacy helpers for seeding library content.

Seeding is no longer part of the workflow. Populate `library_nodes`, articles, and blocks
through migrations or manual SQL instead.
"""
from typing import Dict

from sqlmodel import Session


def seed_library_topics(
    session: Session,
    overwrite: bool = False,
    clear_existing: bool = False,
) -> Dict[str, int]:
    return {"created": 0, "updated": 0}


def seed_library_articles(
    session: Session,
    overwrite: bool = False,
    clear_existing: bool = False,
) -> Dict[str, int]:
    return {"created": 0, "updated": 0}


def reset_library_content(session: Session) -> Dict[str, Dict[str, int]]:
    return {"topics": seed_library_topics(session), "articles": seed_library_articles(session)}


