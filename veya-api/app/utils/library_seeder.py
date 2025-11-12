"""
Legacy helpers for library seeding.

The library now relies on manual population of `library_nodes`, so these helpers are
kept only to avoid import errors.
"""
from __future__ import annotations

from typing import Dict

from sqlmodel import Session


def seed_library_categories(
    session: Session,
    overwrite: bool = False,
    clear_existing: bool = False,
) -> Dict[str, int]:
    """No-op placeholder. Library data should be managed manually."""
    return {"created": 0, "updated": 0}


def reset_library_categories(session: Session) -> Dict[str, int]:
    """No-op placeholder."""
    return seed_library_categories(session, overwrite=True, clear_existing=True)


