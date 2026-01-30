#!/usr/bin/env python3

from __future__ import annotations

import argparse
import subprocess
from pathlib import Path

from utils import load_config


def run(cmd: list[str], cwd: Path, dry_run: bool) -> None:
    if dry_run:
        print(f"[dry-run] ({cwd}) $ {' '.join(cmd)}")
        return
    subprocess.run(cmd, cwd=cwd, check=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Set up shared repo as submodule or subtree.")
    parser.add_argument("--config", default="scripts/blog_repo_split/config.json", help="Path to config JSON")
    parser.add_argument("--mode", choices=["submodule", "subtree"], help="Override shared mode")
    parser.add_argument("--branch", default=None, help="Branch to use (default from config)")
    parser.add_argument("--dry-run", action="store_true", help="Print commands without running")
    args = parser.parse_args()

    config = load_config(Path(args.config).resolve())
    shared = config.get("shared", {})

    mode = args.mode or shared.get("mode")
    repo_url = shared.get("repo_url")
    path = shared.get("path")
    branch = args.branch or shared.get("branch", "main")
    targets = shared.get("targets", ["hub"])

    if not mode:
        raise SystemExit("Missing shared.mode in config")
    if not repo_url or "YOUR_ORG" in repo_url:
        raise SystemExit("Set shared.repo_url in config before running.")
    if not path:
        raise SystemExit("Missing shared.path in config")

    hub_repo = Path(config["hub_repo_path"]).resolve()
    blogs_repo = Path(config["blogs_repo_path"]).resolve()

    for target in targets:
        repo_root = hub_repo if target == "hub" else blogs_repo
        if not (repo_root / ".git").exists():
            raise SystemExit(f"{repo_root} is not a git repo")

        if mode == "submodule":
            cmd = ["git", "submodule", "add", "-b", branch, repo_url, path]
            run(cmd, repo_root, args.dry_run)
        else:
            cmd = ["git", "subtree", "add", "--prefix", path, repo_url, branch, "--squash"]
            run(cmd, repo_root, args.dry_run)


if __name__ == "__main__":
    main()
