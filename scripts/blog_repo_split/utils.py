#!/usr/bin/env python3

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict


def load_config(config_path: Path) -> Dict[str, Any]:
    with config_path.open("r", encoding="utf-8") as f:
        return json.load(f)


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def resolve_path(base: Path, rel: str) -> Path:
    return (base / rel).resolve()


def is_text_file(path: Path) -> bool:
    try:
        with path.open("rb") as f:
            chunk = f.read(4096)
        return b"\x00" not in chunk
    except OSError:
        return False


def apply_replacements(text: str, replacements: Dict[str, str]) -> str:
    for key, value in replacements.items():
        text = text.replace(key, value)
    return text


def safe_write_text(path: Path, content: str, force: bool) -> None:
    if path.exists() and not force:
        raise FileExistsError(f"Refusing to overwrite existing file: {path}")
    ensure_dir(path.parent)
    path.write_text(content, encoding="utf-8")


def safe_copy_file(src: Path, dest: Path, force: bool) -> None:
    if dest.exists() and not force:
        raise FileExistsError(f"Refusing to overwrite existing file: {dest}")
    ensure_dir(dest.parent)
    dest.write_bytes(src.read_bytes())


def normalize_path(path_str: str) -> str:
    return os.path.normpath(path_str)
