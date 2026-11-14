"""Shared deterministic statement-text normalization."""

import re


def normalize_description(description: str) -> str:
    """Lowercase text and replace non-ASCII-letter boundaries with spaces."""
    # Separators must not join adjacent words into a new matching keyword.
    letters_and_spaces = re.sub(r"[^a-z\s]", " ", description.lower())
    return " ".join(letters_and_spaces.split())
