"""Utility to generate URL-safe slugs from fabric names."""
import re
import uuid


def generate_slug(name: str, suffix_len: int = 6) -> str:
    """
    Generate an SEO-friendly slug from a name.
    Example: "Cotton Poplin 60s x 60s" -> "cotton-poplin-60s-x-60s-a1b2c3"
    """
    s = name.lower().strip()
    s = re.sub(r'[^a-z0-9\s-]', '', s)  # remove non-alphanumeric
    s = re.sub(r'[\s-]+', '-', s)        # collapse spaces/hyphens
    s = s.strip('-')
    # Append short unique suffix to avoid collisions
    suffix = uuid.uuid4().hex[:suffix_len]
    return f"{s}-{suffix}" if s else suffix
