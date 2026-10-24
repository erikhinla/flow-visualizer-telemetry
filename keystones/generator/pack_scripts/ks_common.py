"""Shared helpers for the Context Keystones scripts. Python 3.8+, standard library only."""
import datetime as _dt
import os
import re
import sys

TODAY = _dt.date.today().isoformat()

# Windows consoles often can't print every character (curly quotes, trademark signs). Never crash on that.
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(errors="replace")
    except Exception:
        pass


# Every project keeps its shared facts in one folder at the top: projects/<project>/_context/
CONTEXT_DIR = "_context"
CONTEXT_FILES = ("project.md", "mandatories.md", "legal-lines.md", "rights-and-licenses.md",
                 "decisions.md", "change-log.md", "AI-CONTEXT.md")


def ctx(root, name):
    """Path to one of the project's shared context files."""
    return os.path.join(root, CONTEXT_DIR, name)


def is_project(path):
    return os.path.isfile(ctx(path, "project.md"))


def find_project_root(start=None):
    """Walk up from start (or the current folder) until a project folder (one holding _context/project.md) is found."""
    here = os.path.abspath(start or os.getcwd())
    probe = here
    while True:
        if is_project(probe):
            return probe
        parent = os.path.dirname(probe)
        if parent == probe:
            sys.exit("Couldn't find _context/project.md in %s or any folder above it. "
                     "Run this from inside a project folder, or pass --project PATH." % here)
        probe = parent


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def write(path, text):
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)


def parse_tables(text):
    """Return every markdown table in text as a list of dicts keyed by lowercased header."""
    tables, lines, i = [], text.splitlines(), 0
    while i < len(lines):
        line = lines[i].strip()
        if line.startswith("|") and i + 1 < len(lines) and re.match(r"^\|\s*:?-{2,}", lines[i + 1].strip()):
            headers = [h.strip().lower() for h in line.strip("|").split("|")]
            rows, i = [], i + 2
            while i < len(lines) and lines[i].strip().startswith("|"):
                cells = [c.strip() for c in lines[i].strip().strip("|").split("|")]
                cells += [""] * (len(headers) - len(cells))
                rows.append(dict(zip(headers, cells)))
                i += 1
            tables.append(rows)
        else:
            i += 1
    return tables


def key_values(path):
    """Read a Keystone file's | key | value | table(s) into a dict. Rows with an empty key are skipped."""
    out = {}
    for table in parse_tables(read(path)):
        if not table or not any(c in table[0] for c in ("current value", "approved wording", "value")):
            continue  # skip history tables such as "Previous values"
        for row in table:
            k = row.get("key", "")
            v = row.get("current value", row.get("approved wording", row.get("value", "")))
            k = k.strip("` ")
            if k:
                out[k] = v
    return out


LOGGED = set()  # projects that got new change-log rows in this run


def flush_notices():
    """Send one change notice per project that logged changes, if notices are set up. Never raises."""
    roots = sorted(LOGGED)
    LOGGED.clear()
    if not roots:
        return
    try:
        try:
            import notify
        except ImportError:
            return  # notices aren't part of this copy
        if notify.DEFER:
            return
        for r in roots:
            notify.after_log(r)
    except Exception as e:
        print("Change notice skipped: %s" % e)


import atexit as _atexit
_atexit.register(flush_notices)


def append_change(root, kind, what, source, affects, announced="pending"):
    """Append one row to change-log.md. Row format: | date | type | what changed | source | affects | announced to |"""
    path = ctx(root, "change-log.md")
    text = read(path)
    row = "| %s | %s | %s | %s | %s | %s |" % (TODAY, kind, what.replace("|", "/"), source, affects, announced)
    write(path, text.rstrip("\n") + "\n" + row + "\n")
    LOGGED.add(os.path.abspath(root))


DATE_EXAMPLE = "2026-11-14"


def check_date(s, allow_blank=True):
    """Return (date or None, problem or None) for a typed date. Blank and TBC are fine when allowed."""
    s = (s or "").strip()
    if not s or s.upper() == "TBC":
        return None, (None if allow_blank else "A date is needed. Type it like %s." % DATE_EXAMPLE)
    m = re.match(r"^(\d{4})-(\d{1,2})-(\d{1,2})$", s)
    if not m:
        return None, "That isn't a date this can read. Type it like %s (year-month-day)." % DATE_EXAMPLE
    try:
        return _dt.date(*map(int, m.groups())), None
    except ValueError:
        return None, "That date doesn't exist. Try it like %s." % DATE_EXAMPLE


def past_warning(d, label="That date"):
    if d and d < _dt.date.today():
        return "Heads up: %s (%s) is already in the past. Kept as typed." % (label, d.isoformat())
    return None


def date_arg(s):
    """argparse type: a real date in YYYY-MM-DD form, or TBC."""
    import argparse
    d, problem = check_date(s)
    if problem:
        raise argparse.ArgumentTypeError("%s You typed %s." % (problem, s))
    return d.isoformat() if d else "TBC"


def parse_date(s):
    s = (s or "").strip()
    for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%m/%d/%Y"):
        try:
            return _dt.datetime.strptime(s, fmt).date()
        except ValueError:
            pass
    return None
