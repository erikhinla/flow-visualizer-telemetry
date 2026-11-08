#!/usr/bin/env python3
"""
export_update.py : paste-ready plain text and Markdown for a round agenda and for change rows.

USAGE
    python3 scripts/export_update.py --project PATH
    python3 scripts/export_update.py --project PATH --format text
    python3 scripts/export_update.py --project PATH --format md

WHAT IT DOES
    Reads the existing project, decision and change-log tables. Writes files under
    _context/exports/ and one EXPORT-LOG row. Re-export of the same row ids keeps the
    same export identity. It never sends a message and never changes "announced to".
"""
import argparse, datetime, hashlib, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ks_common import ctx, TODAY, find_project_root, parse_tables, read, write, require_columns

FIELDS = ("date", "type", "what changed", "source", "affects", "announced to")


def row_id(row):
    raw = "|".join(row.get(k, "") for k in ("date", "type", "what changed", "source", "affects"))
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()[:16]


def table_with(path, col):
    for t in parse_tables(read(path)):
        if t and col in t[0]:
            return t
    return []


def show(value, fallback="unresolved"):
    text = (value or "").strip()
    return text if text else fallback


def version_of(text):
    import re
    m = re.search(r"([\w.\-()]*\b(?:v|ver|version|r|rev|round)\s*\d{1,3}\b[\w.\-()]*)", text or "", re.I)
    return m.group(1) if m else "unresolved"


def load_rows(root):
    require_columns(ctx(root, "change-log.md"), ["date", "type", "what changed", "source", "affects", "announced to"], "change-log.md")
    require_columns(ctx(root, "decisions.md"), ["date", "decision", "decided by", "status"], "decisions.md")
    require_columns(ctx(root, "project.md"), ["round"], "project.md")
    changes = table_with(ctx(root, "change-log.md"), "type")
    decisions = table_with(ctx(root, "decisions.md"), "decision")
    rounds = table_with(ctx(root, "project.md"), "round")
    return changes, decisions, rounds


def change_blocks(changes, decisions):
    lines_txt, lines_md = [], ["| id | date | type | owner | version | action | source | status |", "|---|---|---|---|---|---|---|---|"]
    ids = []
    open_rows = [d for d in decisions if d.get("status", "").lower() == "open"]
    for row in changes:
        if row.get("type", "").upper() == "ROUND":
            continue
        ident = row_id(row)
        ids.append(ident)
        owner = show(row.get("affects"))
        version = version_of(row.get("what changed", ""))
        action = show(row.get("what changed"))
        source = show(row.get("source"))
        announced = (row.get("announced to") or "").strip().lower()
        status = "announced" if announced and announced != "pending" else "not announced"
        lines_txt.append("\n".join([
            "ID: %s" % ident,
            "DATE: %s" % show(row.get("date")),
            "TYPE: %s" % show(row.get("type")),
            "OWNER: %s" % owner,
            "VERSION: %s" % version,
            "ACTION: %s" % action,
            "SOURCE: _context/change-log.md (%s)" % source,
            "STATUS: %s" % status,
        ]))
        lines_md.append("| %s | %s | %s | %s | %s | %s | _context/change-log.md | %s |" % (
            ident, show(row.get("date")), show(row.get("type")), owner.replace("|", "/"), version.replace("|", "/"),
            action.replace("|", "/"), status))
    if open_rows:
        lines_txt.append("OPEN QUESTIONS")
        for d in open_rows:
            lines_txt.append("- %s | owner: %s | blocks: %s | source: _context/decisions.md" % (
                show(d.get("decision")), show(d.get("decided by")), show(d.get("affects"))))
            lines_md.append("| open | %s | OPEN | %s | unresolved | %s | _context/decisions.md | unresolved |" % (
                show(d.get("date")), show(d.get("decided by")).replace("|", "/"), show(d.get("decision")).replace("|", "/")))
    else:
        lines_txt.append("OPEN QUESTIONS: none in decisions.md")
    if not ids and not open_rows:
        lines_txt.append("No change rows yet. That is unresolved until a change is logged.")
    return ids, "\n\n".join(lines_txt) + "\n", "\n".join(lines_md) + "\n"


def agenda_text(rnd, changes, decisions, flags):
    open_q = [d for d in decisions if d.get("status", "").lower() == "open"]
    ident = "%s %s" % (show(rnd.get("round"), "unresolved"), show(rnd.get("name"), ""))
    txt = "\n".join([
        "PROJECT / ROUND: %s" % ident.strip(),
        "PURPOSE: %s" % show(rnd.get("what the round is for") or rnd.get("purpose")),
        "VERSION SHOWN: unresolved until the version in the working folder is named in decisions.md",
        "REVIEWERS / AUTHORITY: %s" % show(rnd.get("reviewers")),
        "CHANGES: %d row(s) since the last closed round. See the change export for ids." % len(changes),
        "DECISIONS REQUIRED: %s" % ("; ".join(show(d.get("decision")) for d in decisions if d.get("status", "").lower() not in {"open", "round"}) or "unresolved"),
        "OPEN QUESTIONS: %s" % ("; ".join("%s (owner: %s)" % (show(d.get("decision")), show(d.get("decided by"))) for d in open_q) or "none logged"),
        "LEGAL / RIGHTS FLAGS: %s" % ("; ".join("%s %s" % (f[0], f[2]) for f in flags) or "none logged"),
        "CHECKS: compare the version shown with _context/mandatories.md, legal-lines.md and rights-and-licenses.md",
        "NEXT HANDOFF: unresolved until the receiving owner is named",
        "RECORD LOCATION: _context/project.md, _context/decisions.md, _context/change-log.md",
        "AFTER REVIEW: save notes, record the exact version, and close the round only when that is decided.",
        "EXPORT: not sent. Not marked announced.",
        "",
    ])
    md = txt.replace("PROJECT / ROUND:", "# Agenda\n\nPROJECT / ROUND:")
    return txt, md


def export_identity(ids):
    return hashlib.sha1("|".join(ids).encode("utf-8")).hexdigest()[:12]


def prior_revision(log_text, identity):
    for line in log_text.splitlines():
        if identity and identity in line and line.strip().startswith("|"):
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if cells and cells[0].isdigit():
                return cells[0]
    return None


def write_pair(folder, stem, text, markdown):
    os.makedirs(folder, exist_ok=True)
    write(os.path.join(folder, stem + ".txt"), text)
    write(os.path.join(folder, stem + ".md"), markdown)


def export_agenda(root, rnd, changes, decisions, open_q, flags):
    """Called by round_agenda --export. Writes the agenda only. Does not announce."""
    folder = os.path.join(ctx(root, "exports"))
    txt, md = agenda_text(rnd, changes, decisions + open_q, flags)
    # open questions are already inside decisions; pass the open list through the decisions filter by status.
    del open_q
    write_pair(folder, "agenda-%s" % (rnd.get("round") or "round"), txt, md)
    print("Exported agenda for %s. Not sent. Not marked announced. %s" % (rnd.get("round"), os.path.relpath(folder, root)))
    return folder


def main(argv=None):
    ap = argparse.ArgumentParser(description="Export a paste-ready agenda and change update.")
    ap.add_argument("--project")
    ap.add_argument("--format", choices=("text", "md", "both"), default="both")
    a = ap.parse_args(argv)
    root = find_project_root(a.project)
    before = read(ctx(root, "change-log.md"))
    changes, decisions, rounds = load_rows(root)
    ids, txt, md = change_blocks(changes, decisions)
    identity = export_identity(ids)
    folder = os.path.join(root, "_context", "exports")
    os.makedirs(folder, exist_ok=True)
    log_path = os.path.join(folder, "EXPORT-LOG.md")
    if not os.path.exists(log_path):
        write(log_path, "# Export log\n\nAn export never sends and never marks a row announced.\n\n| revision | identity | rows | written | note |\n|---|---|---|---|---|\n")
    revision = prior_revision(read(log_path), identity)
    if not revision:
        existing = [line for line in read(log_path).splitlines() if line.strip().startswith("|") and line.split("|")[1].strip().isdigit()]
        revision = str(len(existing) + 1)
        write(log_path, read(log_path).rstrip("\n") + "\n| %s | %s | %s | %s | not sent, not marked announced |\n" % (
            revision, identity, ",".join(ids) or "none", TODAY))
    if a.format in ("text", "both"):
        write(os.path.join(folder, "changes.txt"), "UPDATE: revision %s\nIDENTITY: %s\nSOURCE RECORDS: _context/project.md, _context/decisions.md, _context/change-log.md\nEXPORT: not sent. Not marked announced.\n\n%s" % (revision, identity, txt))
    if a.format in ("md", "both"):
        write(os.path.join(folder, "changes.md"), "# Change update\n\nRevision %s. Identity `%s`.\n\nNot sent. Not marked announced.\n\n%s" % (revision, identity, md))
    nxt = next((r for r in rounds if r.get("round")), None)
    if nxt:
        agenda_txt, agenda_md = agenda_text(nxt, [c for c in changes if c.get("type", "").upper() != "ROUND"], decisions, [])
        if a.format in ("text", "both"):
            write(os.path.join(folder, "agenda.txt"), agenda_txt)
        if a.format in ("md", "both"):
            write(os.path.join(folder, "agenda.md"), agenda_md)
    after = read(ctx(root, "change-log.md"))
    if before != after:
        sys.exit("Export changed change-log.md. That is not allowed.")
    print("Export revision %s (%s). %d row id(s). Not sent. Not marked announced." % (revision, identity, len(ids)))
    return revision


if __name__ == "__main__":
    main()
