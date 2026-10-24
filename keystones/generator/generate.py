#!/usr/bin/env python3
"""
generate.py : build a tailored Context Keystones pack from intake answers.

USAGE
    python3 generate.py --intake intake.json [--proof proof.json] --out OUTPUT_FOLDER [--zip]

    intake.json  answers to intake.md (see intake-example.json for every field)
    proof.json   optional PROOF answers ({"agency_name": "...", "answers": {"q3": "q3-c2", ...}})
    --zip        also writes OUTPUT_FOLDER.zip

Python 3.8+, standard library only.
"""
import argparse, json, os, re, shutil, sys, zipfile, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
TODAY = datetime.date.today().isoformat()


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def fkey(s):
    return re.sub(r"[^a-z0-9]+", "_", s.lower()).strip("_")


def w(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text.strip("\n") + "\n")


def bullets(items):
    return "\n".join("- %s" % i for i in items) if items else "- (none named yet)"


def lst(items):
    items = list(items)
    if not items:
        return "nobody named yet"
    return items[0] if len(items) == 1 else ", ".join(items[:-1]) + " and " + items[-1]


DEFAULT_STAGES = ["Kickoff", "Brief", "Concept", "Production", "Review", "Delivery"]

# What PROOF already told us, turned into tailoring notes. Choice ids from questionnaire.ts.
PROOF_NOTES = {
    "q3": {"q3-c1": "Briefs, approvals and feedback mostly live in memory today, so project.md and decisions.md start as the first written record.",
           "q3-c2": "Briefs, approvals and feedback are spread across docs, decks and chats today, so each project gets one record that points to the rest.",
           "q3-c3": "Files sit in a loose folder or project today. The folder tree below gives each one a single home.",
           "q3-c4": "There's already one record anyone can open. These files plug into it rather than replace it."},
    "q7": {"q7-c1": "Ownership has been unclear when work moves, so every handoff names the receiving owner.",
           "q7-c2": "Ownership depends on who's available, so each folder README names the owning role, not a person.",
           "q7-c3": "Ownership is informal today, so each folder README names the owning role.",
           "q7-c4": "Every deliverable already has an owner. The handoff protocol keeps that owner on the record."},
    "q8": {"q8-c1": "AI tools are in use without operating rules, so AI-CONTEXT.md sets the rules every assistant reads first.",
           "q8-c2": "AI output is inconsistent today, so AI-CONTEXT.md and the skills give every assistant the same facts and steps.",
           "q8-c3": "AI workflows run but are fragmented, so every assistant reads from the same Keystone files.",
           "q8-c4": "AI already runs with rules and an accountable person. AI-CONTEXT.md gives that person one file to maintain."},
    "q12": {"q12-c1": "Work stops when the person who knows the client is out, so the handoff protocol puts that knowledge in project.md.",
            "q12-c2": "Work slows sharply when the client lead is out, so the handoff protocol puts that knowledge in project.md.",
            "q12-c3": "The team copes when the client lead is out. project.md makes that easier.",
            "q12-c4": "Work continues when someone's out. project.md keeps it that way."},
}


def load(args):
    with open(args.intake, encoding="utf-8") as f:
        I = json.load(f)
    P = {}
    if args.proof:
        with open(args.proof, encoding="utf-8") as f:
            P = json.load(f)
    I.setdefault("agency_name", P.get("agency_name", "The agency"))
    I.setdefault("stages", DEFAULT_STAGES)
    I.setdefault("storage", "the team's shared cloud drive")
    _seen, _types = set(), []
    for _t in I.get("mandatory_types", []):
        _t = _t.strip()
        _k = _t.lower().rstrip("s")
        if _t and _k not in _seen:
            _seen.add(_k); _types.append(_t[0].upper() + _t[1:])
    if "mandatory_types" in I:
        I["mandatory_types"] = _types
        _vals = {k.strip().lower(): v for k, v in (I.get("mandatory_values") or {}).items()}
        if _vals:
            I["mandatory_values"] = {t: _vals[t.lower()] for t in _types if t.lower() in _vals}
    I.setdefault("version_style", "v1, v2, v3")
    I.setdefault("change_channels", [])
    I.setdefault("deliverables", [])
    I.setdefault("mandatory_types", [])
    I.setdefault("legal_line_types", [])
    I.setdefault("rights_types", [])
    I.setdefault("handoffs", [])
    I.setdefault("record_owner", "Account lead")
    I.setdefault("rights_owner", "Business Affairs")
    notes = []
    for q, opts in PROOF_NOTES.items():
        a = P.get("answers", {}).get(q)
        if a in opts:
            notes.append(opts[a])
    I["_proof_notes"] = notes
    fp = I.get("first_project") or {}
    sys.path.insert(0, os.path.join(HERE, "pack_scripts"))
    from ks_common import check_date, past_warning
    for field, label in (("due", "due date"), ("flight_start", "flight start"), ("flight_end", "flight end")):
        d, problem = check_date(fp.get(field))
        if problem:
            sys.exit("First project %s %r: %s" % (label, fp.get(field), problem))
        if field == "due" and past_warning(d, "the due date"):
            print(past_warning(d, "the due date"))
    return I


# ---------------------------------------------------------------- folder tree
def folder_plan(I):
    """Return [(relative folder, what lives there, owning role)]."""
    depts = {d["name"]: d for d in I["departments"]}
    own = lambda name, fallback: depts.get(name, {}).get("lead", fallback) if name in depts else fallback
    acc = own("Account", I["record_owner"]); crt = own("Creative", "Creative lead")
    prd = own("Production", "Producer"); strat = own("Strategy", acc); med = own("Media", acc)
    plan = []
    n = 0
    for st in I["stages"]:
        s = st.lower()
        tag = "%02d_%s" % (n, slug(st))
        if s == "review":
            plan.append((tag, "Every review round, one folder per round, with its agenda, the version shown and the notes that came back.", acc))
            for r in I["rounds"]:
                plan.append(("%s/%s_%s" % (tag, r["id"], slug(r["name"])),
                             "%s %s. Reviewers: %s.%s Agenda, the version shown (one file, the current one) and notes from this round." %
                             (r["id"], r["name"], lst(r["reviewers"]),
                              " Business Affairs reviews this round." if r.get("business_affairs") else ""), acc))
        elif s == "kickoff":
            plan.append((tag, "Kickoff materials: the client's request, scope, budget notes, contacts, the kickoff deck and meeting notes. Facts that last go into project.md.", acc))
        elif s == "brief":
            plan.append((tag, "The brief and what fed it: research, insight work, the client's input and the strategist's notes. The agreed brief is copied into project.md so it outlives any one person.", strat))
        elif s in ("concept", "concepts", "creative"):
            plan.append((tag, "Concept work: routes, scripts, boards, key visuals and the pitch or presentation deck. Only the current version of each file sits here. Older ones move to _archive.", crt))
        elif s in ("production", "produce"):
            plan.append((tag, "Production: one subfolder per deliverable type. Working files, edits, artwork and source assets. Licensed assets are listed in rights-and-licenses.md before they're used.", prd))
            for d in I["deliverables"]:
                plan.append(("%s/%s" % (tag, slug(d)), "Production files for %s. Current versions only." % d, prd))
        elif s in ("delivery", "release", "launch"):
            plan.append((tag, "Final, approved masters ready to ship, one subfolder per deliverable type, plus the delivery spec sheets. Nothing goes here until it's approved in decisions.md.", prd))
            for d in I["deliverables"]:
                plan.append(("%s/%s" % (tag, slug(d)), "Approved masters for %s." % d, prd))
        elif s in ("media", "media plan", "planning"):
            plan.append((tag, "The media plan, flighting and placements. Planned media and territories are copied into rights-and-licenses.md so the rights check stays current.", med))
        else:
            plan.append((tag, "Work for the %s stage." % st, acc))
        n += 1
    plan.append(("templates", "Templates that carry client mandatories and legal lines as marked placeholders. sync_mandatories.py keeps them current.", I["record_owner"]))
    plan.append(("_archive", "Every older version, moved here by archive_old_versions.py with the same sub-folders as the project. ARCHIVE-LOG.md lists every move. Nothing here is deleted.", I["record_owner"]))
    return plan


# ---------------------------------------------------------------- markdowns
def project_md(I):
    rounds = "\n".join("| %s | %s | %s | %s | %s |" % (r["id"], r["name"], "; ".join(r["reviewers"]),
                       "yes" if r.get("business_affairs") else "no", "yes" if r.get("client_sees") else "no") for r in I["rounds"])
    team = "\n".join("| %s | %s | (name) |" % (d["name"], d.get("lead", "")) for d in I["departments"])
    return f"""
# {{{{CLIENT}}}} : {{{{PROJECT}}}}

This is the source record for the project. The brief lives here so it outlasts any one person on the team.
Owner of this file: {I['record_owner']}. Created {{{{CREATED}}}}. Job code {{{{CODE}}}}.

## The brief (agreed version)
- The ask, in the client's words:
- The business problem:
- Who it's for:
- The insight:
- What it has to do (single-minded proposition):
- Must-haves (also in mandatories.md):
- Deliverables: {', '.join(I['deliverables'])}
- Media: see the Plan in rights-and-licenses.md
- Budget range:
- Key dates: due {{{{DUE}}}}; flight {{{{FLIGHT_START}}}} to {{{{FLIGHT_END}}}}
- How success gets measured:

## The thinking behind the brief
Questions creative teams usually ask later get answered here, so the answer doesn't depend on who's still on the account.
- What we considered and ruled out, and why:
- What the client reacted to in early conversations:
- Tone the client has approved before, and tone they've pushed back on:
- Sources and research (link the files in the brief folder):

## Team
| department | lead role | name |
|---|---|---|
{team}

## Review rounds
| round | name | reviewers | business affairs | client sees it |
|---|---|---|---|---|
{rounds}

## Client contacts
| name | role | approves what |
|---|---|---|
| | | |
"""


def mandatories_md(I):
    rows = []
    for t in I["mandatory_types"]:
        val = I.get("mandatory_values", {}).get(t, "(current value)")
        rows.append("| `mandatory.%s` | %s | %s | {{CREATED}} | client |" % (fkey(t), t, val))
    return f"""
# Client mandatories: {{{{CLIENT}}}}

Every client must-have, in one place. People and AI tools both read from this file.
Templates use these values through placeholders like `{{{{KS:mandatory.logo_lockup}}}}`. After a change here,
run `sync_mandatories.py --apply` and every template that uses it picks it up.
Owner: {I['record_owner']}. When a value changes, follow protocols/change-protocol.md.

| key | what it is | current value | last changed | source |
|---|---|---|---|---|
{chr(10).join(rows)}

## Previous values
Old values move here when they change, with the date, so the history stays visible.

| key | old value | replaced on | why |
|---|---|---|---|
"""


def legal_md(I):
    rows = []
    for t in I["legal_line_types"]:
        val = I.get("legal_values", {}).get(t, "(approved wording)")
        rows.append("| `legal.%s` | %s | %s | (where it's required) | {{CREATED}} | %s |" % (fkey(t), t, val, I["rights_owner"]))
    return f"""
# Legal lines: {{{{CLIENT}}}}

The client-approved legal wording, word for word. Copy that needs a legal line pulls it from here through
a placeholder like `{{{{KS:legal.disclaimer}}}}`, so a change made once reaches every file that uses it.
Owner: {I['rights_owner']}. Nobody edits a line here without the client's approved wording on file.

| key | line | approved wording | required on | approved on | approved by |
|---|---|---|---|---|---|
{chr(10).join(rows)}

## Previous wording
| key | old wording | replaced on | client reference |
|---|---|---|---|
"""


def rights_md(I):
    types = ", ".join(I["rights_types"]) or "music, talent, stock, fonts"
    return f"""
# Rights and licenses: {{{{CLIENT}}}}

One row per licensed asset ({types}). `rights_check.py` reads this file and flags any asset whose license
doesn't cover the planned media or territories, or ends before the flight does.
Owner: {I['rights_owner']}. Media and territory lists are separated by `;`.

## Plan
- Planned media: {'; '.join(I.get('usual_media', [])) or '(fill in from the media plan)'}
- Planned territories: {'; '.join(I.get('usual_territories', [])) or '(fill in)'}
- Flight: {{{{FLIGHT_START}}}} to {{{{FLIGHT_END}}}}

## Assets
| asset | type | licensor | media | territory | start | expiry | usage notes |
|---|---|---|---|---|---|---|---|
| (example) Track name | music | Publisher / label | Broadcast; Online video | US | 2026-01-01 | 2026-12-31 | sync + master, 30s and 15s cutdowns |

## Clearance status
| asset | cleared for | cleared on | by | conditions |
|---|---|---|---|---|
"""


def decisions_md(I):
    return """
# Decisions: {{CLIENT}} : {{PROJECT}}

Every decision that shapes the work, with who made it and when, so nobody has to remember the last yes.
Approvals of a specific version name the file and the version. `round_agenda.py` reads this file.
Mark a question that still needs an answer with status `open`.

| date | decision | decided by | round | affects | status |
|---|---|---|---|---|---|
| {{CREATED}} | Project set up with Context Keystones | %s | kickoff | everyone | done |
""" % I["record_owner"]


def change_log_md(I):
    return """
# Change log: {{CLIENT}} : {{PROJECT}}

Every change that touches the work, in date order. The scripts add rows here on their own; people add rows
for anything else (a new client request, a scope change, a new contact). `round_agenda.py` builds each
round's agenda from the rows below the last ROUND row.
Types: CHANGE, MANDATORY, LEGAL, RIGHTS, SYNC, ARCHIVE, HANDOFF, ROUND.

| date | type | what changed | source | affects | announced to |
|---|---|---|---|---|---|
| {{CREATED}} | CHANGE | Project created | new_project.py | everyone | team |
"""


def ai_context_md(I):
    notes = "\n".join("- %s" % n for n in I["_proof_notes"]) or "- (no PROOF answers supplied)"
    return f"""
# AI-CONTEXT: read this first

Any AI assistant working on {{{{CLIENT}}}} : {{{{PROJECT}}}} for {I['agency_name']} reads these files before it writes,
edits or checks anything, and treats them as the facts of the project.

All of these sit beside this file in the project's `_context/` folder.

1. `project.md` : the brief and the thinking behind it. The source record.
2. `mandatories.md` : client must-haves. Use the current value column only.
3. `legal-lines.md` : approved legal wording. Use it word for word. Never paraphrase a legal line.
4. `rights-and-licenses.md` : what each licensed asset may be used for, where and until when.
5. `decisions.md` : what's been decided and what's still open.
6. `change-log.md` : what's changed recently. Newer rows override older material.

## Rules for any assistant
- If a file here disagrees with something in a chat, an email or an older deck, these files win. Say so.
- Only work from the current version of a file. Anything in `_archive/` is history, not the current work.
- If a fact is missing, say it's missing and name the file it belongs in. Don't fill the gap with a guess.
- Flag, don't decide: an assistant can point out a rights or legal problem, but {I['rights_owner']} decides.
- Instruction files for common jobs are in the pack's `skills/` folder.

## How this agency set things up (from the PROOF scan)
{notes}
"""


def skills(I):
    ba_rounds = [r for r in I["rounds"] if r.get("business_affairs")]
    return {
        "draft-a-brief.md": f"""
# Skill: draft a brief

For an AI assistant helping {I['agency_name']} draft or tidy a brief.

1. Read the project's `_context/` folder: AI-CONTEXT.md, then project.md, mandatories.md and decisions.md.
2. Work from the material the team gives (kickoff notes, the client's request, research). Quote the client's words where they exist.
3. Fill the headings in the "The brief (agreed version)" section of project.md. Keep each one to a few lines.
4. Fill "The thinking behind the brief" from the notes: options ruled out, client reactions, tone history. This is what lets the team answer creative questions later without the original author.
5. List every must-have that belongs in mandatories.md and every legal requirement that belongs in legal-lines.md, separately, so the record owner ({I['record_owner']}) can add them.
6. End with a short list headed "Missing" naming every heading you couldn't fill and who would know.
Never invent a business result, audience number or client quote.
""",
        "write-round-notes.md": f"""
# Skill: write round notes

For an AI assistant turning review feedback into round notes.

1. Read `_context/AI-CONTEXT.md` and the round's AGENDA file in 04_review/<round>/.
2. Confirm the file and version that was reviewed. If the notes don't name a version, ask which one.
3. Group the feedback by deliverable, then by who gave it. Keep reviewers' wording for anything subjective.
4. Separate three things: changes requested, decisions made, questions still open.
5. Write decisions as new rows for decisions.md (date | decision | decided by | round | affects | status).
6. Write changes as new rows for change-log.md (type CHANGE) with who they affect.
7. If a note touches a mandatory, a legal line or a licensed asset, mark it for {I['rights_owner']}{' (they review ' + lst([r['id'] + ' ' + r['name'] for r in ba_rounds]) + ')' if ba_rounds else ''}.
8. Save the notes as NOTES-<date>.md in the round's folder.
""",
        "check-copy.md": f"""
# Skill: check copy against legal lines and mandatories

For an AI assistant checking a script, caption, layout text, super or end card before it goes to review.

1. Read AI-CONTEXT.md, mandatories.md, legal-lines.md and rights-and-licenses.md in the project's `_context/` folder. Use current values only.
2. For each legal line whose "required on" includes this deliverable, check the copy carries it word for word. Report missing lines and any wording that differs, character by character if needed.
3. For each mandatory, check it's present and current (for example the right logo lockup, tagline or URL). Compare against the "Previous values" table to catch old versions.
4. Check every licensed asset referenced in the copy (track, talent, footage) against rights-and-licenses.md for this deliverable's media and territory.
5. Return a table: item | status (ok / missing / outdated / check) | what the file says | what the record says.
6. Don't rewrite creative copy. Report only. {I['rights_owner']} and the creative lead decide what changes.
""",
    }


# ---------------------------------------------------------------- protocols
def change_protocol(I):
    chans = lst(I["change_channels"]) if I["change_channels"] else "the team's usual channels"
    rows = "\n".join("| %s | %s | %s |" % r for r in [
        ("A client mandatory changes", I["record_owner"], "Account, Creative, Production" + (", Media" if any(d['name'] == 'Media' for d in I['departments']) else "")),
        ("A legal line changes", I["rights_owner"], "Account, Creative, Production, everyone with an open deliverable that carries the line"),
        ("A license or clearance changes", I["rights_owner"], "Production, Media, Account"),
        ("The media plan or territories change", "Media lead" if any(d['name'] == 'Media' for d in I['departments']) else I['record_owner'], I['rights_owner'] + ", Production, Account"),
        ("The brief or scope changes", I["record_owner"], "Strategy, Creative, Production, Media"),
        ("A new version is approved", I["record_owner"], "Production and anyone editing that deliverable"),
    ])
    return f"""
# Change protocol

How {I['agency_name']} gets each change to the people it affects. Changes are announced today through {chans}.
That stays. What's added is a written record, so the change reaches files as well as people.

## The rule
A change counts once it's in the record. Whoever receives it from the client:
1. Updates the Keystone file it belongs in, in the project's `_context/` folder (mandatories.md, legal-lines.md, rights-and-licenses.md, project.md or decisions.md), moving the old value to the "Previous" table.
2. Adds a row to change-log.md naming who it affects.
3. Runs `sync_mandatories.py --apply` if it's a mandatory or a legal line, so every template picks it up.
4. Announces it through {chans}, linking to the change-log row, and fills in "announced to".

## Who gets which changes
| change | updated by | goes to |
|---|---|---|
{rows}

## Versions
Versions are named {I['version_style']}. When a new version is shared, `archive_old_versions.py --apply` runs on the project
so the working folders hold the current version only. Approval of a version is a row in decisions.md naming the file.
"""


def rounds_protocol(I):
    rows = "\n".join("| %s %s | %s | %s | %s | %s |" % (r["id"], r["name"], lst(r["reviewers"]),
                     "yes" if r.get("business_affairs") else "no", "yes" if r.get("client_sees") else "no",
                     r.get("purpose", "")) for r in I["rounds"])
    ba = [r for r in I["rounds"] if r.get("business_affairs")]
    return f"""
# Review rounds protocol

Who reviews which round at {I['agency_name']}, and what each round gets ready beforehand.

| round | reviewers | Business Affairs | client sees it | what the round is for |
|---|---|---|---|---|
{rows}

## Before every round
- `round_agenda.py --write` builds the agenda from change-log.md and decisions.md since the last round. Reviewers get it with the work.
- The version shown is the current one in the working folder. `archive_old_versions.py` has run first.
- Open questions from decisions.md are listed so they get settled, not carried.

## Business Affairs rounds ({lst([r['id'] for r in ba]) if ba else 'none named'})
Business Affairs reviews at {lst([r['id'] + ' ' + r['name'] for r in ba]) if ba else 'no fixed round'}. Between those rounds, changes that touch
rights, legal lines or mandatories still go to them through the change protocol, and the agenda for their next round lists every one.
Before each of these rounds, `rights_check.py` runs and its flags go on the agenda.

## After every round
- Notes are saved in the round's folder (skills/write-round-notes.md helps).
- Decisions go into decisions.md, changes into change-log.md.
- `round_agenda.py --close` marks the round as run, so the next agenda starts there.
"""


def handoff_protocol(I):
    blocks = []
    for h in I["handoffs"]:
        blocks.append("## %s to %s\n%s" % (h["from"], h["to"], bullets(h["items"])))
    return f"""
# Handoff protocol

What travels with the work when it moves between departments at {I['agency_name']}. The receiving team gets
the context with the files, so nobody has to find the person who knew.

## Every handoff
- The current version only, with its file name as listed in decisions.md.
- A pointer to project.md (the brief and the thinking behind it), mandatories.md, legal-lines.md and rights-and-licenses.md.
- The change-log rows since the last handoff.
- Open questions from decisions.md, and who's answering each.
- A HANDOFF row in change-log.md: from, to, what moved, and the receiving owner.

{chr(10).join(blocks)}

## When someone leaves the project
Before they go, their part of "The thinking behind the brief" in project.md is filled in, open decisions get a new owner,
and a HANDOFF row records who picks up what.
"""


def templates(I):
    out = {}
    m = ["{{KS:mandatory.%s}}" % fkey(t) for t in I["mandatory_types"]]
    l = ["{{KS:legal.%s}}" % fkey(t) for t in I["legal_line_types"]]
    out["end-card-supers.txt"] = "END CARD / SUPERS\n\n" + "\n".join("%s: %s" % (t, p) for t, p in zip(I["mandatory_types"], m)) + \
        "\n\nLEGAL\n" + "\n".join("%s: %s" % (t, p) for t, p in zip(I["legal_line_types"], l)) + "\n"
    out["social-caption.md"] = "# Social caption template\n\nCaption copy here.\n\n" + \
        "\n".join(p for t, p in zip(I["mandatory_types"], m) if any(k in t.lower() for k in ("url", "hashtag", "tagline", "handle"))) + \
        "\n\n" + "\n".join(l) + "\n"
    out["script-template.md"] = "# Script: {{PROJECT}}\n\n| video | audio |\n|---|---|\n| | |\n\n## Required on screen\n" + \
        "\n".join("- " + p for p in m + l) + "\n"
    return out


def how_it_works(I):
    return f"""
# How it works

Context Keystones for {I['agency_name']}. Four parts, each holding up the others.

**Folders.** `project-template/` is the agency's project structure, built on its own stages
({' > '.join(I['stages'])}) and deliverables. Each folder has a README saying what lives there and which role owns it.
Every file gets one home. `_archive/` holds older versions.

**Markdowns.** Each project keeps its shared facts in one folder at the top, `_context/`: project.md, mandatories.md,
legal-lines.md, rights-and-licenses.md, decisions.md and change-log.md, plus AI-CONTEXT.md so any AI assistant reads
the same facts. Every stage folder reads from there. `START HERE.md` in each project explains the layout in one line.

**Launch files.** Double-click the one for the computer in use: `Start Keystones (Mac).command`,
`Start Keystones (Windows).bat` or `start-keystones-linux.sh`. A numbered menu opens. Type a number and press Enter:
1 Start a new project, 2 Move old versions to the archive, 3 Update mandatories and legal lines,
4 Build the next round's agenda, 5 Check rights and licenses, 6 Write the pending changes summary,
7 Turn on watch mode, 8 Switch to a different project, 9 Change notices.
Anything that moves or rewrites files shows a preview first and waits for a yes.
Python 3.8 or newer has to be installed once (python.org). On a Mac, the first open may need right-click, then Open.

**Watch mode.** Menu option 7 checks the project every few minutes while the window stays open. Each check moves
older versions into `_archive/`. When mandatories.md, legal-lines.md or rights-and-licenses.md change, it updates
every template, runs the rights check and adds the results to change-log.md. Then it rewrites PENDING-CHANGES.md,
a plain summary of changes nobody's been told about yet, ready to paste into the team's usual channel.
The first check on a project is always a preview. Nothing is ever deleted. Each check is noted in `_archive/WATCH-LOG.md`.

**Dates.** Every date is typed year-month-day, like 2026-11-14. A date that doesn't exist (2026-10-40, 2026-02-30)
is turned away with an example and asked for again. A due date in the past gets a warning but is kept.
The rights check flags a license date that doesn't exist as DATE.

**Change notices.** Off until set up, in menu option 9. Once on, whenever watch mode or a script logs a change,
the pending changes go out on their own to the roles each kind of change goes to (the routing map in keystones.json,
the same as the change protocol: legal and rights changes go to {I['rights_owner']}, for example). Two ways to send,
either or both: email through the agency's own outgoing mail server, with an address list for each role, and a chat
link, an incoming-webhook address most team chat tools can give a channel. One summary per check, not one per change.
Each change is sent once, then marked "auto notice" in change-log.md. A failed send stays pending and is retried
next check. "Send a test notice" checks the setup without touching any project. The settings, including any mail
password, stay in `local-settings/` on that computer and are left out of shared copies of the pack.

**Scripts.** The same jobs can run from a terminal. They're in `scripts/` (on Windows use `py` in place of `python3`).
| script | run it when | what it does |
|---|---|---|
| `new_project.py --client "X" --project "Y"` | a job starts | copies the template into projects/ with names filled in |
| `archive_old_versions.py --apply` | a new version is shared | moves every older version into _archive/, logged |
| `sync_mandatories.py --apply` | a mandatory or legal line changes | updates every template that uses it, logged |
| `round_agenda.py --write` | before a review round | builds the agenda from changes and decisions since the last round |
| `rights_check.py` | the plan or a license changes, and before Business Affairs rounds | flags gaps in media, territory or term |
| `pending_changes.py` | before the team update | writes PENDING-CHANGES.md from unannounced change-log rows |
| `watch.py --apply` | all the time, if wanted | the watch mode above |
| `notify.py --test` / `--preview` | after setting up notices | sends a test notice, or shows who'd get what |
Project scripts run from inside a project folder, or with `--project PATH`. Without `--apply` they preview only.

**Protocols.** In `protocols/`: who gets which changes, who reviews which round, and what travels at each handoff.

**Skills.** In `skills/`: instruction files any AI assistant can follow to draft a brief, write round notes or check copy.

## A typical week
A client sends new legal wording. {I['rights_owner']} updates `_context/legal-lines.md` and runs `sync_mandatories.py --apply`.
Every template with that line updates and change-log.md records it. Production shares v4 of a cut and runs
`archive_old_versions.py --apply`, so v1 to v3 move to `_archive/`. Before the next round, `round_agenda.py --write`
puts both changes on the agenda, and `rights_check.py` flags anything the plan has outgrown.

Files live in {"the team's shared cloud drive" if I['storage'].strip().lower() in ('cloud file storage', 'cloud storage') else I['storage']}. The folders and scripts work on any synced folder on a computer.
"""


MAC_LAUNCH = """#!/bin/bash
# Double-click to open the Context Keystones menu. The first time, macOS may ask to confirm:
# right-click this file, choose Open, then Open again.
cd "$(dirname "$0")" || exit 1
if command -v python3 >/dev/null 2>&1; then
  python3 scripts/keystones_menu.py
else
  echo "Python 3 isn't installed on this Mac yet. It's available from python.org (version 3.8 or newer)."
fi
echo
read -r -p "Press Enter to close this window." _ || true
"""

LINUX_LAUNCH = """#!/bin/sh
# Opens the Context Keystones menu. Double-click (choose Run in Terminal) or run: sh start-keystones-linux.sh
cd "$(dirname "$0")" || exit 1
if command -v python3 >/dev/null 2>&1; then
  python3 scripts/keystones_menu.py
else
  echo "Python 3 isn't installed yet. Install python3 (3.8 or newer) from the system's software manager."
fi
printf "Press Enter to close this window. "
read _ || true
"""

WIN_LAUNCH = """@echo off
rem Double-click to open the Context Keystones menu.
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  py -3 scripts\\keystones_menu.py
  goto done
)
where python >nul 2>nul
if %errorlevel%==0 (
  python scripts\\keystones_menu.py
  goto done
)
echo Python 3 isn't installed on this computer yet. It's available from python.org (version 3.8 or newer).
echo During install, tick "Add python.exe to PATH".
:done
echo.
pause
"""


def routing_map(I):
    """Which departments hear about each kind of change. Mirrors the change protocol table."""
    depts = [d["name"] for d in I["departments"]]
    ba = next((d["name"] for d in I["departments"] if "business" in d["name"].lower() or "legal" in d["name"].lower()), I["rights_owner"])
    has = lambda *n: [x for x in n if x in depts or x == ba]
    acct = next((d["name"] for d in I["departments"] if d["name"].lower().startswith("account")), depts[0] if depts else "Account")
    return {
        "MANDATORY": has(acct, "Creative", "Production", "Media"),
        "LEGAL": has(ba, acct, "Creative", "Production"),
        "RIGHTS": has(ba, "Production", "Media", acct),
        "MEDIA": has(ba, "Media", "Production", acct),
        "CHANGE": has(acct, "Strategy", "Creative", "Production", "Media"),
        "BRIEF": has(acct, "Strategy", "Creative", "Production", "Media"),
        "APPROVAL": has("Production", acct),
        "SYNC": has("Creative", "Production"),
        "ARCHIVE": has("Production"),
        "HANDOFF": has(acct),
        "ROUND": [],
        "*": [acct],
    }


def write_launchers(out):
    for name, text, nl in [("Start Keystones (Mac).command", MAC_LAUNCH, "\n"),
                           ("start-keystones-linux.sh", LINUX_LAUNCH, "\n"),
                           ("Start Keystones (Windows).bat", WIN_LAUNCH, "\r\n")]:
        path = os.path.join(out, name)
        with open(path, "w", encoding="utf-8", newline=nl) as f:
            f.write(text if text.endswith("\n") else text + "\n")
        os.chmod(path, 0o755)


PRIVATE_FILES = {"notices.json", ".keystones-notices.json", ".keystones-menu.json"}


def build(I, out):
    if os.path.exists(out):
        shutil.rmtree(out)
    tpl = os.path.join(out, "project-template")
    for rel, what, owner in folder_plan(I):
        w(os.path.join(tpl, rel, "README.md"), "# %s\n\n%s\n\nOwning role: %s.\n" % (os.path.basename(rel), what, owner))
    for name, fn in [("project.md", project_md), ("mandatories.md", mandatories_md), ("legal-lines.md", legal_md),
                     ("rights-and-licenses.md", rights_md), ("decisions.md", decisions_md),
                     ("change-log.md", change_log_md), ("AI-CONTEXT.md", ai_context_md)]:
        w(os.path.join(tpl, "_context", name), fn(I))
    w(os.path.join(tpl, "_context", "README.md"),
      "# _context: the project's shared facts\n\n"
      "Every stage folder reads from the files here. When a fact changes (a mandatory, a legal line, a license, "
      "a decision), it changes here once, and the scripts carry it to the work.\n\n"
      "| file | what it holds |\n|---|---|\n"
      "| project.md | the brief, the thinking behind it, the team, key dates, review rounds |\n"
      "| mandatories.md | lines and assets every piece must carry |\n"
      "| legal-lines.md | approved legal wording |\n"
      "| rights-and-licenses.md | the media plan and every license with its media, territory and dates |\n"
      "| decisions.md | what was decided, by whom, in which round |\n"
      "| change-log.md | every change, in date order, and who it was announced to |\n"
      "| AI-CONTEXT.md | the briefing any assistant reads before working on this project |\n")
    w(os.path.join(tpl, "START HERE.md"),
      "# Start here\n\nThe project's shared facts live in `_context/` at the top; the numbered folders are the stages of the work, "
      "and `_archive/` keeps older versions.\n")
    for name, text in templates(I).items():
        w(os.path.join(tpl, "templates", name), text)
    for name, text in skills(I).items():
        w(os.path.join(out, "skills", name), text)
    w(os.path.join(out, "protocols", "change-protocol.md"), change_protocol(I))
    w(os.path.join(out, "protocols", "review-rounds-protocol.md"), rounds_protocol(I))
    w(os.path.join(out, "protocols", "handoff-protocol.md"), handoff_protocol(I))
    w(os.path.join(out, "HOW-IT-WORKS.md"), how_it_works(I))
    w(os.path.join(out, "README.md"), "# Context Keystones: %s\n\nStart with HOW-IT-WORKS.md. Generated %s.\n\n"
      "Get BACK to work. (Business Aligned Context Keystones)\n" % (I["agency_name"], TODAY))
    os.makedirs(os.path.join(out, "scripts"))
    for f in sorted(os.listdir(os.path.join(HERE, "pack_scripts"))):
        if f.endswith(".py"):
            shutil.copy2(os.path.join(HERE, "pack_scripts", f), os.path.join(out, "scripts", f))
    write_launchers(out)
    os.makedirs(os.path.join(out, "projects"), exist_ok=True)
    sys.path.insert(0, os.path.join(HERE, "pack_scripts"))
    import notify as _n
    w(os.path.join(out, "local-settings", "README.md"), _n.README)
    cfg = {k: v for k, v in I.items() if not k.startswith("_")}
    cfg["routing"] = routing_map(I)
    with open(os.path.join(out, "keystones.json"), "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2)
    fp = I.get("first_project")
    if fp:
        sys.path.insert(0, os.path.join(out, "scripts"))
        import new_project
        new_project.main(["--pack", out, "--client", fp["client"], "--project", fp["project"], "--code", fp.get("code", ""),
                          "--due", fp.get("due") or "TBC",
                          "--flight-start", fp.get("flight_start") or "TBC", "--flight-end", fp.get("flight_end") or "TBC"])


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--intake", required=True); ap.add_argument("--proof"); ap.add_argument("--out", required=True)
    ap.add_argument("--zip", action="store_true")
    a = ap.parse_args()
    I = load(a)
    out = os.path.abspath(a.out)
    build(I, out)
    print("Pack written to %s" % out)
    if a.zip:
        z = out.rstrip("/") + ".zip"
        with zipfile.ZipFile(z, "w", zipfile.ZIP_DEFLATED) as zf:
            for dp, dn, fn in os.walk(out):
                dn[:] = [d for d in dn if d != "__pycache__"]
                for f in fn:
                    if f in PRIVATE_FILES:
                        continue  # passwords and send records stay on the computer that made them
                    p = os.path.join(dp, f)
                    zf.write(p, os.path.join(os.path.basename(out), os.path.relpath(p, out)))
        print("Zip written to %s" % z)


if __name__ == "__main__":
    main()
