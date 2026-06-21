from __future__ import annotations

import subprocess
from importlib import metadata
from typing import Optional
from . import __version__

PANE_VERSION_TIMEOUT_SECONDS = 2


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
        result = subprocess.run(
            [executable_path, "--version"],
            capture_output=True,
            text=True,
            timeout=PANE_VERSION_TIMEOUT_SECONDS,
        )
    except (OSError, subprocess.TimeoutExpired):
        return None
    output = (result.stdout + result.stderr).strip()
    return output or None
