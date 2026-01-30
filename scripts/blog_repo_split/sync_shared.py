#!/usr/bin/env python3

from __future__ import annotations

import argparse
from pathlib import Path

from utils import ensure_dir, load_config, normalize_path, resolve_path, safe_copy_file


def main() -> None:
    parser = argparse.ArgumentParser(description="Sync shared files from hub to blogs repo.")
    parser.add_argument("--config", default="scripts/blog_repo_split/config.json", help="Path to config JSON")
    parser.add_argument("--dry-run", action="store_true", help="Print actions without changing files")
    parser.add_argument("--force", action="store_true", help="Overwrite existing files")
    args = parser.parse_args()

    config = load_config(Path(args.config).resolve())
    hub_repo = Path(config["hub_repo_path"]).resolve()
    blogs_repo = Path(config["blogs_repo_path"]).resolve()

    actions = []

    for item in config.get("shared_files", []):
        src = resolve_path(hub_repo, normalize_path(item["from"]))
        dest = resolve_path(blogs_repo, normalize_path(item["to"]))
        actions.append(f"copy {src} -> {dest}")
        if not args.dry_run:
            ensure_dir(dest.parent)
            safe_copy_file(src, dest, args.force)

    if args.dry_run:
        print("\n".join(actions))


if __name__ == "__main__":
    main()
