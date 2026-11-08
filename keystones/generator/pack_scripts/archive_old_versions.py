#!/usr/bin/env python3
"""
archive_old_versions.py : keep only the current version of each file in the project's working folders.

USAGE (from anywhere inside a project folder):
    python3 path/to/scripts/archive_old_versions.py            # preview only, moves nothing
    python3 path/to/scripts/archive_old_versions.py --apply    # move older versions into _archive/
    Options: --project PATH (project folder), --no-log (skip the change-log.md row)

WHAT IT DOES
    Finds files whose names end in a version mark, for example:
        Spot_30s_v1.mp4  Spot_30s_v2.mp4  Spot_30s_V3.mp4
        Script-R1.docx   Script-R2.docx   Deck rev4.pdf   Brief_version_2.md
    Files are grouped by folder + name (without the version mark) + extension. The highest
    number in each group stays put. Every lower version moves to _archive/ under the same
    sub-path, so nothing is deleted. Each move is written to _archive/ARCHIVE-LOG.md, and
    a summary row goes into change-log.md.
    Files that name an older version (like Spot_v2_markup.pdf) aren't moved, but they're listed
    as CHECK so nobody keeps working against an old cut.
    If the archive already has a file with that name, the moved file gets a timestamp suffix.
"""
import argparse, datetime, os, re, shutil, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ks_common import TODAY, ctx, find_project_root, append_change, parse_tables, read

VERSION_RE = re.compile(r"^(?P<base>.*?)[\s_\-\.\(\[]*(?P<tag>v|ver|version|r|rev|round)[\s_\-\.]?(?P<num>\d{1,3})[\)\]]?$", re.I)
CONFIRM_RE = re.compile(r"(final(_final)?|20\d{2}[-_.]\d{2}[-_.]\d{2})", re.I)
SKIP_DIRS = {"_archive", "_context", ".git", "__pycache__"}


def split_version(filename):
    stem, ext = os.path.splitext(filename)
    m = VERSION_RE.match(stem)
    if not m or not m.group("base"):
        return None
    return m.group("base").lower().strip(" _-."), ext.lower(), int(m.group("num"))


def main(argv=None):
    ap = argparse.ArgumentParser(description="Move every older version into _archive/.")
    ap.add_argument("--project")
    ap.add_argument("--apply", action="store_true", help="Actually move files. Without this it's a preview.")
    ap.add_argument("--no-log", action="store_true")
    a = ap.parse_args(argv)
    root = find_project_root(a.project)

    approved = set()
    decisions = ctx(root, "decisions.md")
    if os.path.isfile(decisions):
        for table in parse_tables(read(decisions)):
            for row in table:
                if row.get("status", "").lower() not in {"done", "approved", "locked"}:
                    continue
                for word in re.findall(r"[\w.\-()]+", row.get("decision", "")):
                    if "." in word:
                        approved.add(word.lower())

    groups = {}
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fn in filenames:
            sv = split_version(fn)
            if sv:
                groups.setdefault((dirpath,) + sv[:2], []).append((sv[2], fn))
            elif CONFIRM_RE.search(fn):
                print("CONFIRM %s is not treated as a version. Name the current file before archiving it." % os.path.relpath(os.path.join(dirpath, fn), root))

    moves = []
    for (dirpath, base, ext), items in sorted(groups.items()):
        if len(items) < 2:
            continue
        nums = [n for n, _fn in items]
        if len(nums) != len(set(nums)):
            print("CONFLICT %s has two files with the same version number. Nothing in that group was moved." % os.path.relpath(dirpath, root))
            continue
        items.sort()
        keep = items[-1]
        held = [fn for _num, fn in items if fn.lower() in approved]
        if held:
            print("SAFEGUARD %s is named in an approved decision. Nothing in that group was moved." % held[0])
            continue
        for num, fn in items[:-1]:
            src = os.path.join(dirpath, fn)
            rel = os.path.relpath(src, root)
            dest = os.path.join(root, "_archive", rel)
            if os.path.exists(dest):
                s, e = os.path.splitext(dest)
                dest = "%s__%s%s" % (s, datetime.datetime.now().strftime("%Y%m%d-%H%M%S"), e)
            moves.append((src, dest, rel, keep[1]))

    if not moves:
        print("Nothing to archive. Every versioned file is already the only version in its folder.")
        return []

    log_lines = []
    for src, dest, rel, kept in moves:
        print("%s %s  ->  %s   (current: %s)" % ("MOVE" if a.apply else "WOULD MOVE", rel,
                                                 os.path.relpath(dest, root), kept))
        if a.apply:
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            shutil.move(src, dest)
            log_lines.append("| %s | %s | %s | %s |" % (TODAY, rel, os.path.relpath(dest, root), kept))

    if a.apply:
        log = os.path.join(root, "_archive", "ARCHIVE-LOG.md")
        if not os.path.exists(log):
            with open(log, "w", encoding="utf-8") as f:
                f.write("# Archive log\n\nEvery move made by archive_old_versions.py.\n\n"
                        "| date | moved from | moved to | current version left in place |\n|---|---|---|---|\n")
        with open(log, "a", encoding="utf-8") as f:
            f.write("\n".join(log_lines) + "\n")
        if not a.no_log:
            current = sorted({m[3] for m in moves})
            append_change(root, "ARCHIVE", "%d older version(s) moved to _archive. Current: %s"
                          % (len(moves), ", ".join(current)), "archive_old_versions.py", "everyone on the project", "n/a")
        print("Moved %d file(s). Log: _archive/ARCHIVE-LOG.md" % len(moves))
    else:
        print("Preview only. Run again with --apply to move %d file(s)." % len(moves))
    # Files left behind that name an archived version (markups, notes, exports made against an old cut)
    for src, dest, rel, kept in moves:
        stem = os.path.splitext(os.path.basename(src))[0].lower()
        for fn in os.listdir(os.path.dirname(src)) if os.path.isdir(os.path.dirname(src)) else []:
            if fn.lower().startswith(stem) and fn.lower() != os.path.basename(src).lower():
                print("CHECK %s refers to %s, which isn't current. Current is %s."
                      % (os.path.join(os.path.dirname(rel), fn), os.path.basename(src), kept))
    return moves


if __name__ == "__main__":
    main()
