#!/usr/bin/env python3
"""
round_agenda.py : build the next review round's agenda from what's changed since the last round.

USAGE (from anywhere inside a project folder):
    python3 path/to/scripts/round_agenda.py                      # print the next round's agenda
    python3 path/to/scripts/round_agenda.py --write              # also save it in that round's folder
    python3 path/to/scripts/round_agenda.py --write --close      # save it and mark the round as run
    Options: --project PATH, --round "R2 Internal creative" (pick a round), --since 2026-10-01

WHAT IT READS
    project.md         the "Review rounds" table (round | name | reviewers | business affairs | client sees it)
    change-log.md      rows dated after the last ROUND row (or --since)
    decisions.md       decisions dated after the same point, plus every row still marked open
    rights-and-licenses.md   current rights flags, when the round has Business Affairs on it
WHAT IT WRITES
    --write   04_review/<round folder>/AGENDA-<date>.md
    --close   a ROUND row in change-log.md and a marker row in decisions.md, so the next agenda starts from here
"""
import argparse, glob, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ks_common import ctx, TODAY, find_project_root, parse_tables, parse_date, date_arg, read, write, append_change
import rights_check


def table_with(path, col):
    for t in parse_tables(read(path)):
        if t and col in t[0]:
            return t
    return []


def main(argv=None):
    ap = argparse.ArgumentParser(description="Build the next review round agenda.")
    ap.add_argument("--project"); ap.add_argument("--round"); ap.add_argument("--since", type=date_arg)
    ap.add_argument("--write", action="store_true"); ap.add_argument("--close", action="store_true")
    a = ap.parse_args(argv)
    root = find_project_root(a.project)

    rounds = table_with(ctx(root, "project.md"), "round")
    changes = table_with(ctx(root, "change-log.md"), "type")
    run = [c for c in changes if c.get("type", "").upper() == "ROUND"]
    run_ids = {c.get("what changed", "").split(" ")[0] for c in run}
    if a.round:
        rnd = next((r for r in rounds if r["round"] == a.round or a.round.lower() in (r["round"] + " " + r.get("name", "")).lower()), None)
    else:
        rnd = next((r for r in rounds if r["round"] not in run_ids), None)
    if not rnd:
        sys.exit("No round left to run. Every round in project.md has a ROUND row in change-log.md.")

    since = parse_date(a.since) if a.since else (max(parse_date(c["date"]) for c in run) if run else None)
    after = lambda d: since is None or (parse_date(d) or since) >= since
    if a.since or not run:
        new_changes = [c for c in changes if c.get("type", "").upper() != "ROUND" and after(c.get("date"))]
    else:  # everything logged below the last ROUND row
        last = max(i for i, c in enumerate(changes) if c.get("type", "").upper() == "ROUND")
        new_changes = [c for c in changes[last + 1:] if c.get("type", "").upper() != "ROUND"]
    decisions = table_with(ctx(root, "decisions.md"), "decision")
    marks = [i for i, d in enumerate(decisions) if d.get("status", "").lower() == "round"]
    pool = decisions[marks[-1] + 1:] if (marks and not a.since) else [d for d in decisions if after(d.get("date"))]
    new_dec = [d for d in pool if d.get("decision") and d.get("status", "").lower() not in ("open", "round")]
    open_q = [d for d in decisions if d.get("status", "").lower() == "open"]
    ba = rnd.get("business affairs", "").lower() in {"yes", "y", "x", "true"}

    L = ["# Agenda: %s %s" % (rnd["round"], rnd.get("name", "")), "",
         "- Project: see project.md", "- Built: %s from change-log.md and decisions.md%s" %
         (TODAY, " since %s" % since if since else " (first round, everything so far)"),
         "- Reviewers this round: %s" % rnd.get("reviewers", ""),
         "- Business Affairs on this round: %s" % ("yes" if ba else "no"),
         "- Client sees this round: %s" % rnd.get("client sees it", ""), "",
         "## 1. What changed since the last round (%d)" % len(new_changes)]
    L += ["- %s [%s] %s. Affects: %s. Announced to: %s" % (c["date"], c["type"], c["what changed"],
          c.get("affects", ""), c.get("announced to", "")) for c in new_changes] or ["- Nothing logged."]
    L += ["", "## 2. Decisions made since the last round (%d)" % len(new_dec)]
    L += ["- %s %s (decided by %s, %s)" % (d["date"], d["decision"], d.get("decided by", ""), d.get("status", ""))
          for d in new_dec] or ["- None logged."]
    L += ["", "## 3. Open questions to settle this round (%d)" % len(open_q)]
    L += ["- %s (raised %s, affects %s)" % (d["decision"], d["date"], d.get("affects", "")) for d in open_q] or ["- None."]
    if ba:
        _, flags = rights_check.check(root)
        L += ["", "## 4. Rights and clearance check (%d flag(s))" % len(flags)]
        L += ["- %s %s: %s" % f for f in flags] or ["- All clear against the current plan."]
    L += ["", "## Notes from this round", "", "(Write round notes here or use skills/write-round-notes.md.)", ""]
    agenda = "\n".join(L)
    print(agenda)

    if a.write:
        hits = [p for p in glob.glob(os.path.join(root, "*_review*", "*")) if os.path.basename(p).startswith(rnd["round"])]
        folder = hits[0] if hits else os.path.join(root, "04_review", rnd["round"])
        os.makedirs(folder, exist_ok=True)
        out = os.path.join(folder, "AGENDA-%s.md" % TODAY)
        write(out, agenda)
        print("Saved: %s" % os.path.relpath(out, root))
    if a.close:
        append_change(root, "ROUND", "%s %s run. Agenda covered %d change(s), %d decision(s)." %
                      (rnd["round"], rnd.get("name", ""), len(new_changes), len(new_dec)),
                      "round_agenda.py", rnd.get("reviewers", ""), "round attendees")
        dp = ctx(root, "decisions.md")
        write(dp, read(dp).rstrip("\n") + "\n| %s | %s run | round_agenda.py | %s | marker | round |\n" % (TODAY, rnd["round"], rnd["round"]))
        print("Marked %s as run in change-log.md and decisions.md." % rnd["round"])


if __name__ == "__main__":
    main()
