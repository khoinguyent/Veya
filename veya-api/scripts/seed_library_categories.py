#!/usr/bin/env python3
"""Placeholder script indicating that automatic category seeding is retired."""

import sys

MESSAGE = (
    "Library category seeding has been deprecated. Populate `library_nodes` manually "
    "or via your own migration tooling."
)


def main() -> None:
    print(MESSAGE)


if __name__ == "__main__":
    main()
    sys.exit(0)


