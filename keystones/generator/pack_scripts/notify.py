#!/usr/bin/env python3
"""
notify.py : send change notices on their own, once changes are logged.

OFF UNTIL SET UP. Turn it on from the launcher menu (9. Change notices), which writes
local-settings/notices.json in the pack's top folder. That file can hold a mail password,
so it stays on this computer: it's left out of shared copies of the pack. See local-settings/README.md.

USAGE
    python3 scripts/notify.py --project PATH          # send what's pending now, if notices are on
    python3 scripts/notify.py --test                  # send a test notice to every address and the chat link
    python3 scripts/notify.py --project PATH --preview  # show who would get what, send nothing

HOW IT WORKS
    Reads the rows in _context/change-log.md still marked "pending". The routing map in keystones.json
    names which roles each kind of change goes to (legal and rights changes go to Business Affairs, for example).
    One summary per check: every address gets one email listing only the changes routed to its roles, and the
    chat link gets one post with everything, grouped by role. Each row is sent once: what's been sent is kept in
    the project's .keystones-notices.json, and once every channel has it, the row's "announced to" column is
    filled in with "auto notice <date>: <roles>". A failed send leaves the row pending, so the next check retries it.

DELIVERY (standard library only)
    Email through the agency's own outgoing mail server (host, port, security, sign-in, from address).
    A chat link: an incoming-webhook address that accepts a posted message. Sends JSON {"text": ...} or plain text.
"""
import argparse, datetime, hashlib, json, os, smtplib, ssl, sys, urllib.request
from email.message import EmailMessage
HERE = os.path.dirname(os.path.abspath(__file__))
PACK = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from ks_common import ctx, TODAY, find_project_root, parse_tables, read, write

SETTINGS_DIR = os.path.join(PACK, "local-settings")
SETTINGS = os.path.join(SETTINGS_DIR, "notices.json")
DEFER = False  # watch mode sets this, so a whole check sends one summary at the end

DEFAULT_ROUTING = {
    "MANDATORY": ["Account", "Creative", "Production", "Media"],
    "LEGAL": ["Business Affairs", "Account", "Creative", "Production"],
    "RIGHTS": ["Business Affairs", "Production", "Media", "Account"],
    "MEDIA": ["Business Affairs", "Media", "Production", "Account"],
    "CHANGE": ["Account", "Strategy", "Creative", "Production", "Media"],
    "BRIEF": ["Account", "Strategy", "Creative", "Production", "Media"],
    "APPROVAL": ["Production", "Account"],
    "ARCHIVE": ["Production"],
    "HANDOFF": ["Account"],
    "SYNC": ["Creative", "Production"],
    "ROUND": [],
    "*": ["Account"],
}

README = """# local-settings: stays on this computer

notices.json holds the change notice settings: the outgoing mail server, the sign-in for it,
the address list for each role and the chat link.

WARNING: it can hold a mail password and a private chat link. Don't share it, email it, or put it
in a shared or synced folder that other people can open. Copies of the pack made for sharing leave
this folder out. If someone else sets up a copy of the pack, they set up their own notices.

To keep the password out of the file entirely, leave it blank in the menu and set KEYSTONES_MAIL_PASSWORD
on this computer instead.
"""


def load_settings():
    try:
        with open(SETTINGS, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def save_settings(s):
    os.makedirs(SETTINGS_DIR, exist_ok=True)
    write(os.path.join(SETTINGS_DIR, "README.md"), README)
    with open(SETTINGS, "w", encoding="utf-8") as f:
        json.dump(s, f, indent=2)
    try:
        os.chmod(SETTINGS, 0o600)
    except OSError:
        pass


def is_on(s):
    return bool(s.get("enabled")) and bool(email_ready(s) or (s.get("webhook") or {}).get("url"))


def email_ready(s):
    e = s.get("email") or {}
    return bool(e.get("host") and e.get("from") and any(s.get("addresses", {}).values()))


def routing():
    try:
        with open(os.path.join(PACK, "keystones.json"), encoding="utf-8") as f:
            r = json.load(f).get("routing")
        if r:
            return r
    except Exception:
        pass
    return DEFAULT_ROUTING


def roles_for(kind, rmap):
    """Roles a kind of change goes to. A kind mapped to an empty list (ROUND markers) gets no notice."""
    k = kind.upper()
    return rmap[k] if k in rmap else (rmap.get("*") or ["Account"])


def row_id(r):
    raw = "|".join(r.get(k, "") for k in ("date", "type", "what changed", "source", "affects"))
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()[:16]


def pending(root):
    for t in parse_tables(read(ctx(root, "change-log.md"))):
        if t and "announced to" in t[0]:
            return [r for r in t if r.get("announced to", "").strip().lower() == "pending"]
    return []


def targets(s):
    out = []
    if email_ready(s):
        for role, addrs in s.get("addresses", {}).items():
            for a in [x.strip() for x in str(addrs).replace(";", ",").split(",") if x.strip()]:
                out.append(("email", a, role))
    if (s.get("webhook") or {}).get("url"):
        out.append(("chat", "chat link", "*"))
    return out


def summary(project, rows, rmap, roles=None):
    L = ["Change notice: %s" % project, "%d change(s) since the last notice." % len(rows), ""]
    groups = {}
    for r in rows:
        for role in roles_for(r.get("type", ""), rmap):
            if roles is None or role in roles:
                groups.setdefault(role, []).append(r)
    for role, rs in groups.items():
        L.append("For %s:" % role)
        L += ["- %s %s: %s" % (r.get("date", ""), r.get("type", "").lower(), r.get("what changed", "").replace("`", "")) for r in rs]
        L.append("")
    L.append("Details are in _context/change-log.md in the project folder.")
    return "\n".join(L)


def send_email(s, messages):
    """messages: [(to, subject, body)]. One connection for the whole check."""
    e = s["email"]
    port = int(e.get("port") or (465 if e.get("security") == "ssl" else 587))
    pw = os.environ.get("KEYSTONES_MAIL_PASSWORD") or e.get("password", "")
    ctxs = ssl.create_default_context()
    srv = smtplib.SMTP_SSL(e["host"], port, timeout=20, context=ctxs) if e.get("security") == "ssl" else smtplib.SMTP(e["host"], port, timeout=20)
    try:
        if e.get("security", "starttls") == "starttls":
            srv.starttls(context=ctxs)
        if e.get("username"):
            srv.login(e["username"], pw)
        for to, subject, body in messages:
            m = EmailMessage()
            m["From"], m["To"], m["Subject"] = e["from"], to, subject
            m.set_content(body)
            srv.send_message(m)
    finally:
        try:
            srv.quit()
        except Exception:
            pass


def send_chat(s, text, rows):
    w = s["webhook"]
    if w.get("format", "json") == "text":
        data, ctype = text.encode("utf-8"), "text/plain; charset=utf-8"
    else:
        data = json.dumps({"text": text, "changes": [{k: r.get(k, "") for k in ("date", "type", "what changed", "affects")} for r in rows]}).encode("utf-8")
        ctype = "application/json"
    req = urllib.request.Request(w["url"], data=data, headers={"Content-Type": ctype, "User-Agent": "context-keystones"}, method="POST")
    with urllib.request.urlopen(req, timeout=20) as resp:
        if resp.status >= 300:
            raise RuntimeError("chat link answered %s" % resp.status)


def mark_announced(root, done):
    """done: {row id: 'auto notice <date>: roles'}. Fills in 'announced to' for those rows only."""
    path = ctx(root, "change-log.md")
    out = []
    headers = None
    for line in read(path).splitlines():
        cells = line.split("|")
        if line.strip().startswith("|") and "announced to" in line.lower():
            headers = [c.strip().lower() for c in cells[1:-1]]
        elif headers and line.strip().startswith("|") and len(cells) >= 8 and cells[-2].strip().lower() == "pending":
            r = dict(zip(headers, [c.strip() for c in cells[1:-1]]))
            if row_id(r) in done:
                cells[-2] = " %s " % done[row_id(r)]
                line = "|".join(cells)
        out.append(line)
    write(path, "\n".join(out) + "\n")


def notify(root, preview=False, force=False):
    """Send one summary per target for every pending row not yet sent there. Returns a list of report lines."""
    s = load_settings()
    if not is_on(s):
        return ["Change notices are off. Set them up in the menu (9) to send them on their own."]
    rmap = routing()
    rows = [r for r in pending(root) if roles_for(r.get("type", ""), rmap)]
    ledger_path = os.path.join(root, ".keystones-notices.json")
    try:
        with open(ledger_path, encoding="utf-8") as f:
            ledger = json.load(f)
    except Exception:
        ledger = {}
    project = os.path.basename(os.path.normpath(root))
    tg = targets(s)
    report, mails, mail_rows = [], [], []
    by_addr = {}
    for kind, addr, role in tg:
        if kind == "email":
            by_addr.setdefault(addr, set()).add(role)
    for addr, roles in by_addr.items():
        mine = [r for r in rows if set(roles_for(r.get("type", ""), rmap)) & roles and "email:" + addr not in ledger.get(row_id(r), [])]
        if mine:
            mails.append((addr, "Change notice: %s (%d)" % (project, len(mine)), summary(project, mine, rmap, roles)))
            mail_rows.append((addr, mine))
    chat_rows = [r for r in rows if "chat" not in ledger.get(row_id(r), [])] if any(t[0] == "chat" for t in tg) else []
    if not mails and not chat_rows:
        return ["Change notices: nothing new to send."]
    if preview:
        report += ["Would email %s: %d change(s)" % (a, len(rs)) for a, rs in mail_rows]
        if chat_rows:
            report.append("Would post %d change(s) to the chat link" % len(chat_rows))
        return report
    if mails:
        try:
            send_email(s, mails)
            for addr, rs in mail_rows:
                for r in rs:
                    ledger.setdefault(row_id(r), []).append("email:" + addr)
            report.append("Emailed %d address(es): %s" % (len(mails), ", ".join(m[0] for m in mails)))
        except Exception as e:
            report.append("Email didn't go out (%s). The changes stay pending and the next check tries again." % e)
    if chat_rows:
        try:
            send_chat(s, summary(project, chat_rows, rmap), chat_rows)
            for r in chat_rows:
                ledger.setdefault(row_id(r), []).append("chat")
            report.append("Posted %d change(s) to the chat link" % len(chat_rows))
        except Exception as e:
            report.append("The chat post didn't go out (%s). The changes stay pending and the next check tries again." % e)
    with open(ledger_path, "w", encoding="utf-8") as f:
        json.dump(ledger, f, indent=1)
    # A row counts as announced once every target that should get it has it
    done = {}
    for r in rows:
        roles = roles_for(r.get("type", ""), rmap)
        need = ["email:" + a for a, rs in by_addr.items() if set(rs) & set(roles)] + (["chat"] if any(t[0] == "chat" for t in tg) else [])
        if need and all(n in ledger.get(row_id(r), []) for n in need):
            done[row_id(r)] = "auto notice %s: %s" % (TODAY, ", ".join(roles))
    if done:
        mark_announced(root, done)
        report.append("Marked %d change(s) as announced in change-log.md" % len(done))
    os.makedirs(os.path.join(root, "_archive"), exist_ok=True)
    with open(os.path.join(root, "_archive", "NOTICE-LOG.md"), "a", encoding="utf-8") as f:
        f.write("%s\n%s\n\n" % (datetime.datetime.now().strftime("%Y-%m-%d %H:%M"), "\n".join("  " + l for l in report)))
    return report


def after_log(root):
    """Called by a script after it logs changes. Watch mode defers to one summary per check."""
    if DEFER or not is_on(load_settings()):
        return []
    rep = notify(root)
    for l in rep:
        print(l)
    return rep


def send_test():
    s = load_settings()
    tg = targets(s)
    if not tg:
        return ["Nothing to test yet. Set up email (with at least one address) or a chat link first."]
    text = "Test notice from Context Keystones, sent %s.\nIf this arrived, change notices can reach this address." % TODAY
    rep = []
    mails = [(a, "Context Keystones test notice", text) for k, a, r in tg if k == "email"]
    mails = list({m[0]: m for m in mails}.values())
    if mails:
        try:
            send_email(s, mails)
            rep.append("Test email sent to %s" % ", ".join(m[0] for m in mails))
        except Exception as e:
            rep.append("Test email failed: %s" % e)
    if any(t[0] == "chat" for t in tg):
        try:
            send_chat(s, text, [])
            rep.append("Test post sent to the chat link")
        except Exception as e:
            rep.append("Test post failed: %s" % e)
    return rep


def main(argv=None):
    ap = argparse.ArgumentParser(description="Send change notices for pending changes.")
    ap.add_argument("--project"); ap.add_argument("--test", action="store_true"); ap.add_argument("--preview", action="store_true")
    a = ap.parse_args(argv)
    rep = send_test() if a.test else notify(find_project_root(a.project), preview=a.preview)
    for l in rep:
        print(l)
    return rep


if __name__ == "__main__":
    main()
