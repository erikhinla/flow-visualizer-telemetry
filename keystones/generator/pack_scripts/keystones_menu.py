#!/usr/bin/env python3
"""
keystones_menu.py : the plain-English menu behind the launch files.

Double-click the launch file for the computer in use, in the pack's top folder:
    Mac:      Start Keystones (Mac).command
    Windows:  Start Keystones (Windows).bat
    Linux:    start-keystones-linux.sh
Each one opens this menu. Type a number and press Enter. Nothing changes without a yes.
Python 3.8+ standard library only.
"""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
PACK = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import notify, ks_common, new_project, archive_old_versions, sync_mandatories, round_agenda, rights_check, watch, pending_changes

PREFS = os.path.join(PACK, ".keystones-menu.json")


INPUT_ENDED = False  # set when the keyboard input closes, so the menu can't loop forever


def ask(prompt, default=""):
    try:
        v = input("%s%s: " % (prompt, " [%s]" % default if default else "")).strip()
    except EOFError:
        global INPUT_ENDED
        INPUT_ENDED = True
        v = ""
    return v or default


def ask_date(prompt, due_date=False):
    """Ask until the answer is a real date or blank. Blank means TBC."""
    from ks_common import check_date, past_warning
    for _ in range(20):
        raw = ask(prompt, "TBC")
        d, problem = check_date(raw)
        if problem:
            print(problem)
            if INPUT_ENDED:
                break
            continue
        if due_date and past_warning(d, "that due date"):
            print(past_warning(d, "that due date"))
        return d.isoformat() if d else "TBC"
    return "TBC"


def yes(prompt):
    return ask(prompt + " (y/n)", "n").lower().startswith("y")


def run(fn, argv):
    print()
    try:
        return fn(argv)
    except SystemExit as e:
        if e.code not in (0, 1, None):
            print(e.code)
    except Exception as e:  # keep the menu open whatever happens
        print("Something went wrong: %s" % e)


def projects():
    base = os.path.join(PACK, "projects")
    return sorted(d for d in os.listdir(base) if os.path.isfile(os.path.join(base, d, "_context", "project.md"))) if os.path.isdir(base) else []


def load_prefs():
    try:
        with open(PREFS, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def save_prefs(p):
    with open(PREFS, "w", encoding="utf-8") as f:
        json.dump(p, f)


def pick_project(prefs, force=False):
    ps = projects()
    if not ps:
        print("\nThere's no project yet. Choose 1 to start one.")
        return None
    if not force and prefs.get("project") in ps:
        return prefs["project"]
    print("\nProjects:")
    for i, p in enumerate(ps, 1):
        print("  %d. %s" % (i, p))
    c = ask("Which project? Type its number", "1")
    if c.isdigit() and 1 <= int(c) <= len(ps):
        prefs["project"] = ps[int(c) - 1]
        save_prefs(prefs)
        return prefs["project"]
    print("That number isn't on the list.")
    return None


NOTICES_MENU = """
 Change notices: {state}
  Email: {email}
  Chat link: {chat}
  1. Set up email (the agency's outgoing mail server)
  2. Set the email address for each role
  3. Set up a chat link (an incoming-webhook address)
  4. Send a test notice
  5. Turn notices {toggle}
  0. Back
"""


def notices_menu():
    print("\nChange notices send the pending changes on their own, once per check, to the roles each kind")
    print("of change goes to. They stay off until set up. Settings stay on this computer, in local-settings/.")
    while True:
        s = notify.load_settings()
        e, w = s.get("email") or {}, s.get("webhook") or {}
        print(NOTICES_MENU.format(state="ON" if notify.is_on(s) else "off",
                                  email="%s, from %s" % (e["host"], e.get("from")) if e.get("host") else "not set up",
                                  chat="set (%s)" % w.get("format", "json") if w.get("url") else "not set up",
                                  toggle="off" if s.get("enabled") else "on"))
        c = ask("Type a number and press Enter", "0")
        if c == "0":
            return
        if c == "1":
            e["host"] = ask("Mail server name, like mail.agency.example", e.get("host", ""))
            e["security"] = ask("Security: starttls, ssl or none", e.get("security", "starttls")).lower()
            if e["security"] not in ("starttls", "ssl", "none"):
                print("Use starttls, ssl or none. Kept starttls.")
                e["security"] = "starttls"
            port = ask("Port", str(e.get("port") or (465 if e["security"] == "ssl" else 587)))
            e["port"] = int(port) if port.isdigit() else 587
            e["from"] = ask("Send from address", e.get("from", ""))
            e["username"] = ask("Sign-in name (blank if none)", e.get("username", ""))
            pw = ask("Password (blank keeps the current one; the file stays on this computer)", "")
            if pw:
                e["password"] = pw
            s["email"] = e
        elif c == "2":
            rm = notify.routing()
            roles = sorted({r for v in rm.values() for r in v})
            book = s.setdefault("addresses", {})
            print("Addresses for each role. Separate more than one with commas. Blank keeps what's there; a dash clears it.")
            for role in roles:
                v = ask("  %s" % role, book.get(role, ""))
                if v == "-":
                    book.pop(role, None)
                elif v:
                    book[role] = v
        elif c == "3":
            w["url"] = ask("Chat link address (starts with https://)", w.get("url", ""))
            if w["url"] and not w["url"].startswith(("https://", "http://")):
                print("That doesn't look like a web address. Not saved.")
                continue
            w["format"] = ask("Send as json or text", w.get("format", "json")).lower()
            if w["format"] not in ("json", "text"):
                w["format"] = "json"
            s["webhook"] = w
        elif c == "4":
            for l in notify.send_test():
                print(l)
            continue
        elif c == "5":
            s["enabled"] = not s.get("enabled")
            if s["enabled"] and not notify.is_on(s):
                print("Set up email with at least one address, or a chat link, first.")
                s["enabled"] = False
        else:
            print("Type one of the numbers on the list.")
            continue
        notify.save_settings(s)
        print("Saved.")


MENU = """
==============================================
 Context Keystones{proj}
==============================================
  1. Start a new project
  2. Move old versions to the archive
  3. Update mandatories and legal lines
  4. Build the next round's agenda
  5. Check rights and licenses
  6. Write the pending changes summary
  7. Turn on watch mode (checks every few minutes)
  8. Switch to a different project
  9. Change notices (set up, test, on or off)
  0. Close
"""


def main():
    prefs = load_prefs()
    while True:
        proj = prefs.get("project") if prefs.get("project") in projects() else None
        print(MENU.format(proj="\n Project: %s" % proj if proj else ""))
        c = ask("Type a number and press Enter")
        if INPUT_ENDED and not c:
            print("Closed.")
            return
        if c == "0" or c.lower() in ("q", "quit", "exit"):
            print("Closed.")
            return
        if c == "1":
            client = ask("Client name")
            name = ask("Project name")
            if not client or not name:
                print("Both a client and a project name are needed.")
                continue
            code = ask("Job code (optional)")
            due = ask_date("Due date, like 2026-11-14 (optional)", due_date=True)
            fs = ask_date("Flight start, like 2026-11-14 (optional)")
            fe = ask_date("Flight end, like 2026-11-14 (optional)")
            while fs != "TBC" and fe != "TBC" and fe < fs:
                print("The flight can't end before it starts (%s). Type the end date again." % fs)
                fe = ask_date("Flight end, like 2026-11-14 (optional)")
            dest = run(new_project.main, ["--pack", PACK, "--client", client, "--project", name, "--code", code, "--due", due,
                                          "--flight-start", fs, "--flight-end", fe])
            if dest:
                prefs["project"] = os.path.basename(dest)
                save_prefs(prefs)
            continue
        if c == "8":
            pick_project(prefs, force=True)
            continue
        if c == "9":
            notices_menu()
            continue
        if c not in "234567" or len(c) != 1:
            print("Type one of the numbers on the list.")
            continue
        proj = pick_project(prefs)
        if not proj:
            continue
        root = os.path.join(PACK, "projects", proj)
        if c == "2":
            moves = run(archive_old_versions.main, ["--project", root])
            if moves and yes("\nMove these %d file(s) into _archive now?" % len(moves)):
                run(archive_old_versions.main, ["--project", root, "--apply"])
        elif c == "3":
            res = run(sync_mandatories.main, ["--project", root])
            if res and res[0] and yes("\nWrite these updates now?"):
                run(sync_mandatories.main, ["--project", root, "--apply"])
        elif c == "4":
            run(round_agenda.main, ["--project", root, "--write"])
            if yes("\nMark this round as run, so the next agenda starts after it?"):
                run(round_agenda.main, ["--project", root, "--close"])
        elif c == "5":
            flagged = run(rights_check.main, ["--project", root])
            if flagged and yes("\nAdd these flags to change-log.md?"):
                run(rights_check.main, ["--project", root, "--log"])
        elif c == "6":
            run(pending_changes.main, ["--project", root])
            print("Open PENDING-CHANGES.md in the project folder and paste it into the team's usual channel.")
            if yes("Once it's shared, mark these as announced?"):
                to = ask("Announced where or to whom", "team")
                run(pending_changes.main, ["--project", root, "--mark-announced", to])
        elif c == "7":
            every = ask("Minutes between checks", "5")
            try:
                every = float(every)
            except ValueError:
                every = 5.0
            print("\nThe first check only previews. Later checks move old versions, update mandatories and legal lines,")
            print("run the rights check and write PENDING-CHANGES.md. Nothing is ever deleted.")
            print("Leave this window open. Press Ctrl+C to stop and come back to the menu.")
            run(watch.main, ["--project", root, "--every", str(every), "--apply"])
        ks_common.flush_notices()  # one notice for whatever this action logged, if notices are on
        input("\nPress Enter to go back to the menu.") if sys.stdin.isatty() else None


if __name__ == "__main__":
    main()
