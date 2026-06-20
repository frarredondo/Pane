from __future__ import annotations

import subprocess
from importlib import metadata
from typing import Optional
from . import __version__


def wrapper_version() -> str:
    try:
        return metadata.version("runpane")
    except metadata.PackageNotFoundError:
        return __version__


def print_version(pane_path: object = None) -> int:
    print(f"runpane {wrapper_version()}")
    return 0


def pane_version(executable_path: str) -> Optional[str]:
    try:
        result = subprocess.run([executable_path, "--version"], capture_output=True, text=True, timeout=10)
    except OSError:
        return None
    output = (result.stdout + result.stderr).strip()
    return output or None
