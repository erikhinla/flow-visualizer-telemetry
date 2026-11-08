#!/usr/bin/env python3
"""Bounded checks for a downloaded Context Keystones pack. Not a Mac or Windows acceptance."""
import os
import sys
import zipfile


NEEDLES = (
    "IMPLEMENTATION-PLAN.md",
    "WALKTHROUGH.md",
    "scripts/check_runtime.py",
    "scripts/export_update.py",
    "scripts/keystones_menu.py",
    "Start Keystones (Mac).command",
    "Start Keystones (Windows).bat",
    "start-keystones-linux.sh",
)


def main(argv=None):
    target = (argv or sys.argv[1:])
    path = target[0] if target else "."
    names = []
    if path.endswith(".zip"):
        with zipfile.ZipFile(path) as zf:
            names = zf.namelist()
            bad = [n for n in names if n.endswith("notices.json") or n.endswith(".keystones-notices.json")]
            if bad:
                print("FAIL: settings or send records are inside the zip: %s" % ", ".join(bad))
                return 1
    elif os.path.isdir(path):
        for dirpath, dirnames, filenames in os.walk(path):
            dirnames[:] = [d for d in dirnames if d != "__pycache__"]
            for fn in filenames:
                names.append(os.path.relpath(os.path.join(dirpath, fn), path))
    else:
        print("Give a pack folder or a .zip.")
        return 1
    missing = [n for n in NEEDLES if not any(name.endswith(n) or name.replace("\\", "/").endswith(n) for name in names)]
    if missing:
        print("FAIL: missing %s" % ", ".join(missing))
        return 1
    print("Pack files listed above are present. This does not validate macOS Gatekeeper or a Windows double-click.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
