from __future__ import annotations

import os
import subprocess
import sys
from importlib import metadata
from typing import Optional
from . import __version__

PANE_VERSION_TIMEOUT_SECONDS = 2
POWERSHELL_TIMEOUT_SECONDS = 2


def wrapper_version() -> str:
    try:
        return metadata.version("runpane")
    except metadata.PackageNotFoundError:
        return __version__


def print_version(pane_path: object = None) -> int:
    print(f"runpane {wrapper_version()}")
    return 0


def pane_version(executable_path: str) -> Optional[str]:
    if sys.platform == "win32":
        return _windows_file_version(executable_path)

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


def _windows_file_version(executable_path: str) -> Optional[str]:
    script = "; ".join(
        [
            "$ErrorActionPreference = 'Stop'",
            "$target = $env:RUNPANE_PANE_VERSION_PATH",
            "if (-not $target) { exit 1 }",
            "$info = (Get-Item -LiteralPath $target).VersionInfo",
            "if ($info.FileVersion) { $info.FileVersion } elseif ($info.ProductVersion) { $info.ProductVersion }",
        ]
    )
    try:
        env = {
            **os.environ,
            "RUNPANE_PANE_VERSION_PATH": executable_path,
        }
        result = subprocess.run(
            [
                "powershell.exe",
                "-NoProfile",
                "-NonInteractive",
                "-ExecutionPolicy",
                "Bypass",
                "-Command",
                script,
            ],
            capture_output=True,
            env=env,
            text=True,
            timeout=POWERSHELL_TIMEOUT_SECONDS,
        )
    except (OSError, subprocess.TimeoutExpired):
        return None
    return result.stdout.strip() or None
