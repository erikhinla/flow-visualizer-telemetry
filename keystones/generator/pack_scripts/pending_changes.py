#!/usr/bin/env python3
"""
pending_changes.py : write PENDING-CHANGES.md, a plain summary of changes nobody's been told about yet.

USAGE (from anywhere inside a project folder):
    python3 path/to/scripts/pending_changes.py                         # write PENDING-CHANGES.md
    python3 path/to/scripts/pending_changes.py --mark-announced "team channel, 10/24"
        marks every pending row in change-log.md as announced to that text, then rewrites the summary

WHAT IT DOES
    Reads change-log.md rows whose "announced to" column says pending, groups them by who they
    affect, and writes PENDING-CHANGES.md in the project folder. The text is plain sentences,
    ready to paste into the team's usual channel. Nothing is sent anywhere by this script.
"""
import argparse, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ks_common import ctx, TODAY, find_project_root, parse_tables, read, write


def pending_rows(root):
    for t in parse_tables(read(ctx(root, "change-log.md"))):
        if t and "announced to" in t[0]:
            return [r for r in t if r.get("announced to", "").strip().lower() == "pending"]
    return []


def build(root):
    rows = pending_rows(root)
    name = os.path.basename(root)
    L = ["# Pending changes: %s" % name, "", "Written %s. %d change(s) not announced yet." % (TODAY, len(rows)), ""]
    if not rows:
        L += ["Nothing pending. Everyone who needs a change has it."]
    else:
        L += ["Copy everything below the line into the team's usual channel.", "", "---", "",
              "Changes on %s since the last update:" % name, ""]
        groups = {}
        for r in rows:
            groups.setdefault(r.get("affects", "everyone") or "everyone", []).append(r)
        for who, rs in groups.items():
            L.append("For %s:" % who)
            for r in rs:
                L.append("- %s: %s (%s)" % (r.get("date", ""), r.get("what changed", "").replace("`", ""), r.get("type", "").lower()))
            L.append("")
        L += ["Details are in change-log.md in the project folder.", ""]
    write(os.path.join(root, "PENDING-CHANGES.md"), "\n".join(L))
    return rows


def mark(root, to):
    path = ctx(root, "change-log.md")
    out, n = [], 0
    for line in read(path).splitlines():
        cells = line.split("|")
        if line.strip().startswith("|") and len(cells) >= 8 and cells[-2].strip().lower() == "pending":
            cells[-2] = " %s " % to.replace("|", "/")
            line, n = "|".join(cells), n + 1
        out.append(line)
    write(path, "\n".join(out) + "\n")
    return n


def main(argv=None):
    ap = argparse.ArgumentParser(description="Summarize pending changes for the team.")
    ap.add_argument("--project"); ap.add_argument("--mark-announced", metavar="TO")
    a = ap.parse_args(argv)
    root = find_project_root(a.project)
    if a.mark_announced:
        print("Marked %d row(s) as announced to: %s" % (mark(root, a.mark_announced), a.mark_announced))
    rows = build(root)
    print("PENDING-CHANGES.md written with %d pending change(s)." % len(rows))
    return rows


if __name__ == "__main__":
    main()
