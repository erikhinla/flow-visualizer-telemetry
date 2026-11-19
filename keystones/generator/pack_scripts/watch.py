#!/usr/bin/env python3
"""
watch.py : keep a project current in the background.

USAGE (the launcher menu turns this on; it can also run on its own):
    python3 path/to/scripts/watch.py --project PATH                 # preview every check, change nothing
    python3 path/to/scripts/watch.py --project PATH --apply         # first check previews, later checks apply
    Options: --every 5 (minutes between checks), --once (one check, then stop)
    Stop it with Ctrl+C or by closing the window.

EACH CHECK
    1. Older versions move to _archive/ (archive_old_versions.py). Nothing is ever deleted.
    2. If mandatories.md, legal-lines.md or rights-and-licenses.md changed since the last check:
       sync_mandatories.py runs, then rights_check.py, and its flags go into change-log.md.
    3. PENDING-CHANGES.md is rewritten (pending_changes.py) for the team to paste into its usual channel.
    4. A line goes into _archive/WATCH-LOG.md.

SAFETY
    The very first check on a project is always a preview, even with --apply, so the team sees what it
    would do before it does anything. State lives in .keystones-watch.json in the project folder.
    Delete that file to get a fresh first-run preview.
"""
import argparse, contextlib, datetime, hashlib, io, json, os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import notify, ks_common
from ks_common import ctx, find_project_root
import archive_old_versions, sync_mandatories, rights_check, pending_changes

WATCHED = ("mandatories.md", "legal-lines.md", "rights-and-licenses.md")


def digest(root):
    out = {}
    for f in WATCHED:
        p = ctx(root, f)
        if os.path.exists(p):
            with open(p, "rb") as fh:
                out[f] = hashlib.sha256(fh.read().replace(b"\r\n", b"\n")).hexdigest()
    return out


def quiet(fn, argv):
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        try:
            result = fn(argv)
        except SystemExit as e:
            result = e.code
    return result, buf.getvalue()


def check(root, apply):
    state_path = os.path.join(root, ".keystones-watch.json")
    state = {}
    if os.path.exists(state_path):
        with open(state_path, encoding="utf-8") as f:
            state = json.load(f)
    first = not state.get("checks")
    doing = apply and not first
    flag = ["--apply"] if doing else []
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    report = ["%s  check %d  (%s)" % (now, state.get("checks", 0) + 1, "applying" if doing else "preview only")]

    moves, out = quiet(archive_old_versions.main, ["--project", root] + flag)
    report.append("  archive: %d older version(s) %s" % (len(moves or []), "moved" if doing else "would move"))
    report += ["    " + l for l in out.splitlines() if l.startswith(("MOVE", "WOULD", "CHECK"))]

    new_digest = digest(root)
    changed = [f for f in WATCHED if new_digest.get(f) != state.get("digest", {}).get(f)]
    if changed:
        report.append("  changed since last check: %s" % ", ".join(changed))
        (keys, unknown), out = quiet(sync_mandatories.main, ["--project", root] + flag)
        report.append("  sync: %d key(s) %s, %d unknown placeholder key(s)" % (len(keys), "updated" if doing else "would update", len(unknown)))
        code, out = quiet(rights_check.main, ["--project", root] + (["--log"] if doing else []))
        flags = [l for l in out.splitlines() if l.startswith("FLAG")]
        repeat = out.count("already in change-log.md")
        report.append("  rights check: %d flag(s)%s" % (len(flags), (", %d new one(s) logged to change-log.md" % (len(flags) - repeat)) if doing and flags else ""))
        report += ["    " + l for l in flags]
    else:
        report.append("  mandatories, legal lines and rights unchanged")

    if doing:
        rows, _ = quiet(pending_changes.main, ["--project", root])
        report.append("  PENDING-CHANGES.md: %d pending change(s)" % len(rows or []))
        ks_common.LOGGED.clear()
        report += ["  " + l for l in notify.notify(root)]  # one summary per check
        state["digest"] = digest(root)  # after sync, so its own edits don't count as a change
    elif first and apply:
        report.append("  First check is a preview. The next check applies.")
    state["checks"] = state.get("checks", 0) + 1
    state["last"] = now
    with open(state_path, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)
    os.makedirs(os.path.join(root, "_archive"), exist_ok=True)
    with open(os.path.join(root, "_archive", "WATCH-LOG.md"), "a", encoding="utf-8") as f:
        f.write("\n".join(report) + "\n\n")
    print("\n".join(report))
    return report


def main(argv=None):
    ap = argparse.ArgumentParser(description="Keep a project current in the background.")
    ap.add_argument("--project"); ap.add_argument("--every", type=float, default=5)
    ap.add_argument("--apply", action="store_true"); ap.add_argument("--once", action="store_true")
    a = ap.parse_args(argv)
    root = find_project_root(a.project)
    notify.DEFER = True
    print("Watching %s every %g minute(s). %s" % (root, a.every, "Ctrl+C stops it." if not a.once else ""))
    try:
        while True:
            check(root, a.apply)
            if a.once:
                break
            time.sleep(max(a.every, 0.05) * 60)
    except KeyboardInterrupt:
        print("\nWatch mode stopped.")
    finally:
        notify.DEFER = False


if __name__ == "__main__":
    main()
