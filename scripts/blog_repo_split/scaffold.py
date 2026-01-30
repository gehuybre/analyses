#!/usr/bin/env python3

from __future__ import annotations

import argparse
import shutil
from pathlib import Path
from typing import Dict

from utils import (
    apply_replacements,
    ensure_dir,
    is_text_file,
    load_config,
    normalize_path,
    resolve_path,
    safe_copy_file,
    safe_write_text,
)


def copy_with_optional_replacements(src: Path, dest: Path, replacements: Dict[str, str], force: bool) -> None:
    if is_text_file(src):
        content = src.read_text(encoding="utf-8")
        content = apply_replacements(content, replacements)
        safe_write_text(dest, content, force)
        return
    safe_copy_file(src, dest, force)


def copy_tree(src: Path, dest: Path, force: bool) -> None:
    if dest.exists() and any(dest.iterdir()) and not force:
        raise FileExistsError(f"Refusing to overwrite existing directory: {dest}")
    ensure_dir(dest)
    for path in src.rglob("*"):
        rel = path.relative_to(src)
        target = dest / rel
        if path.is_dir():
            ensure_dir(target)
        else:
            safe_copy_file(path, target, force)


def main() -> None:
    parser = argparse.ArgumentParser(description="Scaffold new blogs repo and copy templates/content.")
    parser.add_argument("--config", default="scripts/blog_repo_split/config.json", help="Path to config JSON")
    parser.add_argument("--dry-run", action="store_true", help="Print actions without changing files")
    parser.add_argument("--force", action="store_true", help="Overwrite existing files")
    args = parser.parse_args()

    config_path = Path(args.config).resolve()
    config = load_config(config_path)

    hub_repo = Path(config["hub_repo_path"]).resolve()
    blogs_repo = Path(config["blogs_repo_path"]).resolve()
    templates = config.get("templates", {})
    blog_subdirs = config.get("blog_subdirs", [])

    actions = []

    def record(action: str) -> None:
        actions.append(action)

    # Create blogs repo root
    record(f"mkdir -p {blogs_repo}")
    if not args.dry_run:
        ensure_dir(blogs_repo)

    # Apply hub templates
    for item in templates.get("hub", []):
        src = resolve_path(hub_repo, normalize_path(item["from"]))
        dest = resolve_path(hub_repo, normalize_path(item["to"]))
        record(f"copy {src} -> {dest}")
        if not args.dry_run:
            copy_with_optional_replacements(src, dest, {}, args.force)

    # Apply blogs repo templates
    for item in templates.get("blogs", []):
        src = resolve_path(hub_repo, normalize_path(item["from"]))
        dest = resolve_path(blogs_repo, normalize_path(item["to"]))
        record(f"copy {src} -> {dest}")
        if not args.dry_run:
            copy_with_optional_replacements(src, dest, {}, args.force)

    # Scaffold each blog
    blog_template_rel = templates.get("blog_template")
    blog_template = resolve_path(hub_repo, normalize_path(blog_template_rel)) if blog_template_rel else None

    for blog in config.get("blogs", []):
        blog_id = blog["id"]
        blog_title = blog.get("title", blog_id)
        target_dir = blogs_repo / blog.get("target_dir", blog_id)
        replacements = {
            "{{BLOG_ID}}": blog_id,
            "{{BLOG_TITLE}}": blog_title,
        }

        record(f"mkdir -p {target_dir}")
        if not args.dry_run:
            ensure_dir(target_dir)

        for subdir in blog_subdirs:
            subdir_path = target_dir / subdir
            record(f"mkdir -p {subdir_path}")
            if not args.dry_run:
                ensure_dir(subdir_path)

        if blog_template:
            dest = target_dir / "blog.json"
            record(f"copy {blog_template} -> {dest}")
            if not args.dry_run:
                copy_with_optional_replacements(blog_template, dest, replacements, args.force)

        for copy_item in blog.get("copy", []):
            src = resolve_path(hub_repo, normalize_path(copy_item["from"]))
            dest = target_dir / normalize_path(copy_item["to"])
            if src.is_dir():
                record(f"copytree {src} -> {dest}")
                if not args.dry_run:
                    copy_tree(src, dest, args.force)
            else:
                record(f"copy {src} -> {dest}")
                if not args.dry_run:
                    copy_with_optional_replacements(src, dest, replacements, args.force)

    if args.dry_run:
        print("\n".join(actions))


if __name__ == "__main__":
    main()
