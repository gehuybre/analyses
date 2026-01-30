These scripts are compatibility shims that delegate to the canonical validation scripts located at

`.github/skills/blog-post-creator/scripts/`

This avoids duplication and keeps invocation paths stable for developers who previously ran `python scripts/...`.
Please update the canonical scripts in `.github/skills/blog-post-creator/scripts/` when changing validation logic.

Standalone scripts:
- `export_data_repo.py`: exports runtime JSON outputs into the `data` repo for GitHub Pages.
