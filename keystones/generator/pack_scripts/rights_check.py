#!/usr/bin/env python3
"""
rights_check.py : flag any asset whose license doesn't cover the plan.

USAGE (from anywhere inside a project folder):
    python3 path/to/scripts/rights_check.py [--project PATH] [--warn-days 30] [--log]
    Exit code is 1 when anything is flagged, so it can run before a release step.

WHAT IT READS (rights-and-licenses.md)
    The "Plan" list:      - Planned media: TV; Social; Online video
                          - Planned territories: US; Canada
                          - Flight: 2026-11-02 to 2027-01-31
    The assets table:     | asset | type | licensor | media | territory | start | expiry | usage notes |
    Separate multiple media or territories with ";" or ",".

WHAT IT FLAGS
    MEDIA       a planned media the license doesn't name ("All media" covers everything;
                "Broadcast" covers TV, radio and broadcast only; "Digital" covers online,
                social, online video, display, CTV, OOH digital and audio streaming)
    TERRITORY   a planned territory the license doesn't name ("Worldwide" covers all)
    TERM        the license expires before the flight ends, or starts after it begins
    SOON        the license expires within --warn-days of today
    MISSING     an asset row with no media, territory or expiry filled in
    --log adds one change-log.md row per new flag. A flag already in the log isn't added twice.
"""
import argparse, datetime, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ks_common import ctx, find_project_root, parse_tables, parse_date, check_date, read, append_change

GROUPS = {
    "all media": {"*"}, "all": {"*"}, "any": {"*"},
    "broadcast": {"tv", "broadcast", "radio"},
    "tv": {"tv"}, "television": {"tv"}, "linear tv": {"tv"},
    "radio": {"radio"},
    "digital": {"online", "online video", "social", "display", "ctv", "digital ooh", "audio streaming", "digital"},
    "online": {"online", "online video", "display"},
    "online video": {"online video"}, "olv": {"online video"},
    "social": {"social"}, "social media": {"social"}, "paid social": {"social"}, "organic social": {"social"},
    "ctv": {"ctv"}, "connected tv": {"ctv"}, "ott": {"ctv"},
    "cinema": {"cinema"}, "ooh": {"ooh", "digital ooh"}, "digital ooh": {"digital ooh"}, "dooh": {"digital ooh"},
    "print": {"print"}, "in-store": {"in-store"}, "audio streaming": {"audio streaming"}, "podcast": {"audio streaming"},
    "internal": {"internal"}, "pitch": {"internal"},
}
WORLD = {"worldwide", "world", "global", "all territories", "universe"}


def split(s):
    return [x.strip().lower() for x in re.split(r"[;,/]", s or "") if x.strip()]


def covers(license_media, planned):
    allowed = set()
    for m in license_media:
        allowed |= GROUPS.get(m, {m})
    target = GROUPS.get(planned, {planned})
    return "*" in allowed or target <= allowed


def load(root):
    text = read(ctx(root, "rights-and-licenses.md"))
    plan = {}
    for line in text.splitlines():
        m = re.match(r"^\s*[-*]\s*(Planned media|Planned territories|Flight)\s*:\s*(.+)$", line, re.I)
        if m:
            plan[m.group(1).lower()] = m.group(2).strip()
    media = split(plan.get("planned media"))
    terr = split(plan.get("planned territories"))
    fs = fe = None
    if "flight" in plan:
        for part in re.split(r"\s+to\s+|\s+-\s+", plan["flight"]):
            if check_date(part)[1]:
                print("WARNING: flight date %s in the Plan table: %s" % (part, check_date(part)[1]))
        parts = re.split(r"\s+to\s+|\s+-\s+", plan["flight"])
        fs = parse_date(parts[0]) if parts else None
        fe = parse_date(parts[1]) if len(parts) > 1 else None
    assets = []
    for t in parse_tables(text):
        if t and "asset" in t[0] and "expiry" in t[0]:
            assets += [r for r in t if r.get("asset") and not r["asset"].startswith("(")]
    return media, terr, fs, fe, assets


def check(root, warn_days=30, today=None):
    today = today or datetime.date.today()
    media, terr, fs, fe, assets = load(root)
    flags = []
    for a in assets:
        name = a["asset"]
        lm, lt, exp, st = split(a.get("media")), split(a.get("territory")), parse_date(a.get("expiry")), parse_date(a.get("start"))
        for col in ("start", "expiry"):
            raw = a.get(col, "")
            if raw and raw.strip().lower() not in {"perpetual", "in perpetuity", "none", "tbc"} and check_date(raw)[1]:
                flags.append(("DATE", name, "%s %s: %s" % (col, raw, check_date(raw)[1])))
        perpetual = (a.get("expiry", "").strip().lower() in {"perpetual", "in perpetuity", "none"})
        if not lm or not lt or (not exp and not perpetual):
            flags.append(("MISSING", name, "media, territory or expiry isn't filled in"))
        for p in media:
            if lm and not covers(lm, p):
                flags.append(("MEDIA", name, "license covers %s, plan includes %s" % (a.get("media"), p)))
        for p in terr:
            if lt and not (set(lt) & WORLD) and p not in lt:
                flags.append(("TERRITORY", name, "license covers %s, plan includes %s" % (a.get("territory"), p)))
        if exp and fe and exp < fe:
            flags.append(("TERM", name, "license expires %s, flight ends %s" % (exp, fe)))
        if st and fs and st > fs:
            flags.append(("TERM", name, "license starts %s, flight starts %s" % (st, fs)))
        if exp and 0 <= (exp - today).days <= warn_days:
            flags.append(("SOON", name, "license expires in %d days (%s)" % ((exp - today).days, exp)))
    return (media, terr, fs, fe, assets), flags


def main(argv=None):
    ap = argparse.ArgumentParser(description="Check licenses against planned media, territory and flight.")
    ap.add_argument("--project")
    ap.add_argument("--warn-days", type=int, default=30)
    ap.add_argument("--log", action="store_true")
    a = ap.parse_args(argv)
    root = find_project_root(a.project)
    (media, terr, fs, fe, assets), flags = check(root, a.warn_days)
    print("Plan: media %s | territories %s | flight %s to %s" % (", ".join(media) or "?", ", ".join(terr) or "?", fs, fe))
    print("Checked %d asset(s)." % len(assets))
    logged = read(ctx(root, "change-log.md")) if a.log else ""
    for kind, name, why in flags:
        print("FLAG %-9s %s: %s" % (kind, name, why))
        text = "%s flag on %s: %s" % (kind, name, why)
        if a.log and text.replace("|", "/") in logged:
            print("          (already in change-log.md, not logged again)")
            continue
        if a.log:
            append_change(root, "RIGHTS", "%s flag on %s: %s" % (kind, name, why), "rights_check.py",
                          "Business Affairs; Account; Media", "pending")
    if not flags:
        print("All clear. Every asset covers the planned media, territories and flight.")
    return 1 if flags else 0


if __name__ == "__main__":
    sys.exit(main())
