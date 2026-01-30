#!/usr/bin/env python3
"""
Scrape publication date from Statbel pages and update MDX frontmatter.

Usage:
    python scripts/update_publication_date.py <analysis_slug> <statbel_url>

Example:
    python scripts/update_publication_date.py starters-stoppers https://statbel.fgov.be/nl/themas/ondernemingen/btw-plichtige-ondernemingen/overleven-van-de-btw-plichtige-ondernemingen
"""

import re
import sys
from datetime import datetime
from pathlib import Path

import requests

# Mapping of Dutch month names to numbers
DUTCH_MONTHS = {
    'januari': 1, 'februari': 2, 'maart': 3, 'april': 4,
    'mei': 5, 'juni': 6, 'juli': 7, 'augustus': 8,
    'september': 9, 'oktober': 10, 'november': 11, 'december': 12
}


def fetch_publication_date(url: str) -> str | None:
    """
    Fetch the publication date from a Statbel page.

    Statbel pages typically show dates in format "16 oktober 2025" or similar.
    Returns date in ISO format (YYYY-MM-DD) or None if not found.
    """
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        html = response.text

        # Pattern for Dutch date format: "1 december 2025" or "16 oktober 2025"
        # Look for dates in article headers, news items, or metadata
        date_pattern = r'(\d{1,2})\s+(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)\s+(\d{4})'

        matches = re.findall(date_pattern, html, re.IGNORECASE)

        if not matches:
            print(f"No publication date found on {url}")
            return None

        # Take the first (most prominent) date found
        day, month_name, year = matches[0]
        month = DUTCH_MONTHS[month_name.lower()]

        date = datetime(int(year), month, int(day))
        iso_date = date.strftime('%Y-%m-%d')

        print(f"Found publication date: {iso_date}")
        return iso_date

    except requests.RequestException as e:
        print(f"Error fetching {url}: {e}")
        return None


def update_mdx_frontmatter(mdx_path: Path, publication_date: str) -> bool:
    """
    Update or add sourcePublicationDate in MDX frontmatter.

    Returns True if the file was modified, False otherwise.
    """
    content = mdx_path.read_text(encoding='utf-8')

    # Check if frontmatter exists (between --- markers)
    if not content.startswith('---'):
        print(f"No frontmatter found in {mdx_path}")
        return False

    # Find end of frontmatter
    end_marker = content.find('---', 3)
    if end_marker == -1:
        print(f"Invalid frontmatter in {mdx_path}")
        return False

    frontmatter = content[3:end_marker]
    rest = content[end_marker:]

    # Check if sourcePublicationDate already exists
    pub_date_pattern = r'^sourcePublicationDate:\s*(\d{4}-\d{2}-\d{2})\s*$'
    match = re.search(pub_date_pattern, frontmatter, re.MULTILINE)
    if match:
        existing_date = match.group(1)
        if existing_date == publication_date:
            print(f"Publication date already up to date in {mdx_path}")
            return False
        # Update existing date
        new_frontmatter = re.sub(
            pub_date_pattern,
            f'sourcePublicationDate: {publication_date}',
            frontmatter,
            flags=re.MULTILINE
        )
    else:
        # Add new field after sourceUrl if it exists, otherwise at the end
        if 'sourceUrl:' in frontmatter:
            # Ensure frontmatter ends with newline before adding new field
            frontmatter_lines = frontmatter.rstrip('\n')
            new_frontmatter = re.sub(
                r'(sourceUrl:\s*[^\n]+)',
                rf'\1\nsourcePublicationDate: {publication_date}',
                frontmatter_lines
            ) + '\n'
        else:
            # Add at end of frontmatter (ensure newline)
            new_frontmatter = frontmatter.rstrip('\n') + f'\nsourcePublicationDate: {publication_date}\n'

    # Write updated content
    new_content = '---' + new_frontmatter + rest
    mdx_path.write_text(new_content, encoding='utf-8')
    print(f"Updated {mdx_path} with publication date {publication_date}")
    return True


def main():
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)

    analysis_slug = sys.argv[1]
    statbel_url = sys.argv[2]

    # Find the MDX file
    script_dir = Path(__file__).parent
    repo_root = script_dir.parent
    mdx_path = repo_root / 'embuild-analyses' / 'analyses' / analysis_slug / 'content.mdx'

    if not mdx_path.exists():
        print(f"MDX file not found: {mdx_path}")
        sys.exit(1)

    # Fetch publication date
    pub_date = fetch_publication_date(statbel_url)
    if not pub_date:
        print("Could not fetch publication date, exiting")
        sys.exit(0)  # Don't fail the workflow, just skip

    # Update MDX
    modified = update_mdx_frontmatter(mdx_path, pub_date)

    if modified:
        print(f"Successfully updated {analysis_slug} with publication date {pub_date}")
    else:
        print(f"No changes needed for {analysis_slug}")


if __name__ == '__main__':
    main()
