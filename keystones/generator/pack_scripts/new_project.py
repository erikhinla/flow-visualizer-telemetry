#!/usr/bin/env python3
"""
new_project.py : build a new project folder from the agency's Keystone template.

USAGE (run from the pack's top folder, the one holding keystones.json):
    python3 scripts/new_project.py --client "Client Name" --project "Project Name" [--code JOB123]
                                   [--due 2026-12-15] [--flight-start 2026-11-01 --flight-end 2027-01-31] [--dry-run]

WHAT IT DOES
    Copies project-template/ to projects/<CODE> <Client> - <Project>/ and fills in
    {{CLIENT}}, {{PROJECT}}, {{CODE}}, {{DUE}}, {{FLIGHT_START}}, {{FLIGHT_END}} and {{CREATED}}
    in every folder name and text file. It never overwrites an existing project folder.
Works on macOS, Windows and Linux with Python 3.8+. No installs needed.
"""
import argparse, os, re, shutil, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ks_common import TODAY, read, write, date_arg, past_warning, check_date

TEXT_EXT = {".md", ".txt", ".json", ".csv", ".html"}


WINDOWS_RESERVED = {"CON", "PRN", "AUX", "NUL"} | {"COM%d" % i for i in range(1, 10)} | {"LPT%d" % i for i in range(1, 10)}


def safe(name):
    """A folder name that's valid on Windows, macOS and Linux alike."""
    name = re.sub(r'[<>:"/\\|?*\x00-\x1f]+', "-", name).strip().rstrip(". ")
    if name.split(".")[0].upper() in WINDOWS_RESERVED:
        name = "_" + name
    return name or "project"


def main(argv=None):
    ap = argparse.ArgumentParser(description="Build a new project folder from the Keystone template.")
    ap.add_argument("--client", required=True)
    ap.add_argument("--project", required=True)
    ap.add_argument("--code", default="")
    ap.add_argument("--due", default="TBC", type=date_arg, help="Due date, YYYY-MM-DD")
    ap.add_argument("--flight-start", default="TBC", type=date_arg)
    ap.add_argument("--flight-end", default="TBC", type=date_arg)
    ap.add_argument("--pack", default=os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                    help="Pack folder holding project-template/ (defaults to the folder above scripts/)")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args(argv)

    fs, fe = check_date(a.flight_start)[0], check_date(a.flight_end)[0]
    if fs and fe and fe < fs:
        sys.exit("The flight ends (%s) before it starts (%s). Nothing created." % (fe, fs))
    warn = past_warning(check_date(a.due)[0], "the due date")
    if warn:
        print(warn)
    template = os.path.join(a.pack, "project-template")
    if not os.path.isdir(template):
        sys.exit("No project-template/ folder in %s" % a.pack)
    tokens = {"{{CLIENT}}": a.client, "{{PROJECT}}": a.project, "{{CODE}}": a.code or "TBC", "{{DUE}}": a.due,
              "{{FLIGHT_START}}": a.flight_start, "{{FLIGHT_END}}": a.flight_end, "{{CREATED}}": TODAY}
    folder = safe(" ".join(x for x in [a.code, a.client, "-", a.project] if x))
    dest = os.path.join(a.pack, "projects", folder)
    if os.path.exists(dest):
        sys.exit("Project folder already exists, nothing changed: %s" % dest)

    made = 0
    for dirpath, dirnames, filenames in os.walk(template):
        rel = os.path.relpath(dirpath, template)
        for tok, val in tokens.items():
            rel = rel.replace(tok, safe(val))
        target_dir = os.path.normpath(os.path.join(dest, rel))
        print("[dir]  %s" % os.path.relpath(target_dir, a.pack))
        if not a.dry_run:
            os.makedirs(target_dir, exist_ok=True)
        for fn in filenames:
            src = os.path.join(dirpath, fn)
            out = os.path.join(target_dir, fn)
            if not a.dry_run:
                if os.path.splitext(fn)[1].lower() in TEXT_EXT:
                    text = read(src)
                    for tok, val in tokens.items():
                        text = text.replace(tok, val)
                    write(out, text)
                else:
                    shutil.copy2(src, out)
            made += 1
    print("%s %d files in %s" % ("Would create" if a.dry_run else "Created", made, dest))
    return dest


if __name__ == "__main__":
    main()
