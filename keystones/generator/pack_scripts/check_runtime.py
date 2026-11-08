#!/usr/bin/env python3
"""Report the Python runtime this pack can see. This does not validate a Mac or a Windows machine."""
import platform
import sys


def report():
    lines = [
        "Python %s at %s" % (platform.python_version(), sys.executable),
        "Platform reported by Python: %s" % platform.platform(),
        "Dependencies: Python standard library only. Nothing else is imported by the pack scripts.",
    ]
    system = platform.system().lower()
    if sys.version_info < (3, 8):
        lines.append("Python 3.8 or newer is required. This copy is too old.")
    elif system == "darwin":
        lines.append("This process is on macOS. A double-clicked .command can still be stopped by Gatekeeper until a person uses right-click, then Open.")
    elif system == "windows":
        lines.append("This process is on Windows. A double-clicked .bat and the py launcher still need a person to confirm them on that computer.")
    else:
        lines.append("This run is not a macOS or Windows acceptance check. Output here does not validate those launchers, Gatekeeper, or the Windows py launcher.")
    return lines


def main(argv=None):
    del argv
    text = report()
    print("\n".join(text))
    return 1 if sys.version_info < (3, 8) else 0


if __name__ == "__main__":
    sys.exit(main())
