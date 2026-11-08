"""Preset worksheets, the implementation plan, and the walkthrough scaffold. Used by generate.py."""


def kind_of(name):
    n = (name or "").strip().lower()
    if "radio" in n or "audio spot" in n:
        return "radio"
    if "print" in n:
        return "print"
    if any(word in n for word in ("experiential", "activation", "event")):
        return "experiential"
    return None


def _role(I, dept, fallback):
    for d in I.get("departments") or []:
        if d.get("name", "").lower() == dept.lower() and d.get("lead"):
            return d["lead"]
    return fallback


def _blank(label):
    return "- %s: unresolved" % label


def radio_files(I):
    owner = I.get("record_owner") or "unresolved: name the owner"
    rights = I.get("rights_owner") or "unresolved: name who can approve rights"
    production = _role(I, "Production", owner)
    return {
        "specification.md": """# Radio specification

This worksheet is for the radio deliverable named in the intake. It does not invent a duration, a station spec, or a clearance.

%s
%s
%s
- Approved script filename and version: unresolved until named in decisions.md
- Language and pronunciation notes: unresolved
- Station or platform delivery specification, and where that spec came from: unresolved
- Planned media, territories and dates: see _context/rights-and-licenses.md
- Exact legal wording: see _context/legal-lines.md. Do not paraphrase it.
- Recording and edit owner: %s
- Final mix or master filename and version: unresolved

Native audio files are not edited by the scripts. A person listens to the export.
""" % (_blank("Job and deliverable identifier"), _blank("Purpose and acceptance criteria"), _blank("Required duration"), production),
        "rights-review.md": """# Radio rights review

Owner: %s

- Voice, music and other licensed asset ids: unresolved until each one is a row in _context/rights-and-licenses.md
- Evidence that the license covers the actual media, territory and dates: unresolved
- Ambiguous license wording stays open. rights_check.py can flag it. It does not clear it.
- Authorized reviewer: %s
""" % (rights, rights),
        "review.md": """# Radio review

Reviewers listen to the actual exported audio against the approved script, the duration requirement, pronunciation and the legal wording.

- Version played: unresolved
- Script version it was recorded from: unresolved
- Duration checked against the supplied specification: unresolved
- Legal wording audible and matching _context/legal-lines.md: unresolved
- Notes saved in this round's folder: unresolved
- Decision, including the exact filename and version: unresolved until written in _context/decisions.md
""",
        "release.md": """# Radio release

- Approved script and master versions are connected in decisions.md: unresolved
- Actual export listened to from beginning to end: unresolved
- Duration and file requirements match the supplied destination specification: unresolved
- Rights evidence covers the intended use and dates: unresolved
- Changes since approval have a new decision: unresolved
- Delivery recipient and next action: unresolved
- Receiving acknowledgement: unresolved

Evidence to keep: the script decision, the rights review, the listening notes, the master decision, and the delivery acknowledgement. No result is claimed by this worksheet.
""",
    }


def print_files(I):
    owner = I.get("record_owner") or "unresolved: name the owner"
    rights = I.get("rights_owner") or "unresolved: name who can approve rights"
    production = _role(I, "Production", owner)
    return {
        "specification.md": """# Print specification

Vendor requirements are recorded here. They are not invented.

%s
%s
- Publication or vendor specification reference and revision: unresolved
- Dimensions, bleed, safe area and finishing, as supplied: unresolved
- Color, profile and PDF requirements, as supplied: unresolved
- Approved copy or artwork filename and version: unresolved until named in decisions.md
- Production owner: %s
- Production file and exported PDF filenames and versions: unresolved
""" % (_blank("Job, placement and deliverable identifier"), _blank("Purpose and acceptance criteria"), production),
        "rights-review.md": """# Print rights review

Owner: %s

- Image, font and other asset ids, linked to _context/rights-and-licenses.md: unresolved
- Legal lines and mandatories to check in the exported PDF: see _context/legal-lines.md and _context/mandatories.md
- Ambiguous wording needs authorized review. A text sync does not verify the native artwork.
""" % rights,
        "review.md": """# Print review

- Proof reviewer: unresolved
- Authorized approver: %s
- Native-application preflight result: unresolved
- Dimensions, bleed and safe area checked in the actual file: unresolved
- Legal lines and mandatories checked in the exported PDF, not only in the text template: unresolved
- Preflight exceptions and their resolution, or an authorized acceptance: unresolved
""" % owner,
        "release.md": """# Print release

- Vendor requirements are current and the source is linked: unresolved
- Approved copy and the final PDF are the versions named in decisions.md: unresolved
- Rights cover the actual placement and term: unresolved
- Delivery manifest names exactly what was sent: unresolved
- Receiving acknowledgement: unresolved
- Release owner: %s

A clean text synchronization log does not verify the native artwork or the PDF.
""" % owner,
    }


def experiential_files(I):
    owner = I.get("record_owner") or "unresolved: name the owner"
    rights = I.get("rights_owner") or "unresolved: name who can approve rights"
    return {
        "specification.md": """# Experiential specification

Site requirements, safety reviews and specialist inspections stay with the people accountable for them. This worksheet records those decisions. It does not perform them.

%s
%s
- Event dates, installation, operating and teardown windows: unresolved
- Venue or vendor requirement references: unresolved
- Audience and intended interaction: unresolved
- Approved designs, scripts and asset versions: unresolved until named in decisions.md
- Vendor deliverables and the accountable role for each: unresolved
""" % (_blank("Event or site and delivery identifier"), _blank("Purpose and acceptance criteria")),
        "rights-review.md": """# Experiential rights and permissions

Owner: %s

- Venue permission: unresolved
- Required safety or accessibility review, and who is authorized to give it: unresolved
- Music, talent, image, location and other usage, linked to _context/rights-and-licenses.md: unresolved
- Ambiguous permission language stays open for authorized review.
""" % rights,
        "review.md": """# Experiential rehearsal and acceptance

- Rehearsal date: unresolved
- Normal use, one exception, and shutdown were rehearsed: unresolved
- Findings and their owners: unresolved
- Installation acceptance against the actual delivered assets: unresolved
- Authorized approver: %s
- Open conditions: unresolved
""" % owner,
        "release.md": """# Experiential handoff and teardown

- Operating instructions and the responsible role: unresolved
- Exception and escalation contact, and who can decide: unresolved
- Receiving operator acknowledgement: unresolved
- Teardown obligations and completion criteria: unresolved
- Teardown acceptance: unresolved

Specialist inspection and what happens on site remain human responsibilities.
""",
    }


WRITERS = {"radio": radio_files, "print": print_files, "experiential": experiential_files}


def worksheets(I, deliverable):
    kind = kind_of(deliverable)
    if not kind:
        return {}
    return WRITERS[kind](I)


def _known_owner(I):
    name = (I.get("agency_name") or "").strip().lower().replace(" ", "")
    return name in {"transformby10x", "tbtx"}


def implementation_plan(I):
    depts = "\n".join("- %s: %s" % (d.get("name"), d.get("lead") or "unresolved: name the lead") for d in I.get("departments") or []) or "- unresolved: name the team"
    rounds = "\n".join("- %s %s. Reviewers: %s. Rights review on this round: %s." % (
        r.get("id"), r.get("name"), ", ".join(r.get("reviewers") or []) or "unresolved",
        "yes" if r.get("business_affairs") else "no") for r in I.get("rounds") or []) or "- unresolved: name the rounds"
    deliverables = I.get("deliverables") or []
    presets = [d for d in deliverables if kind_of(d)]
    proof = I.get("_proof_notes") or []
    proof_block = "\n".join("- %s" % n for n in proof) if proof else "- PROOF selections were not in this build. They stay unknown. Do not invent them."
    owner = ""
    if _known_owner(I):
        owner = """
## Known about this owner
TransformBy10X is Erik's solo practice, with AI assistance. Project files live in the shared Drive. Erik is the final approver.
TBTX, BBAI and BBM are distinct. A job title is used only when the intake names it.
PROOF selections that were not carried in stay unknown.
"""
    return """# Implementation plan: %s

This is the plan for putting this pack to work. It is built from the intake. It is not a generic do-it-yourself guide, and it is not a recording.

## Who owns the record
- Record owner: %s
- Rights owner: %s
- Where files live: %s
- How versions are named: %s

## Team named in the intake
%s

## Stages and rounds named in the intake
%s

## Deliverables
%s
Presets with specification, rights, review and release worksheets: %s

## PROOF notes carried into this pack
%s
%s
## Order of work
1. Unzip the pack into the folder named above. Open START HERE.md in the project.
2. %s confirms the unresolved lines in _context/ before anyone treats them as decided.
3. Preview a script before applying it. The menu asks first. Watch mode's first check is a preview.
4. For radio, print or experiential work, fill the worksheet in that deliverable's folder from the real job. Leave a fact unresolved until someone knows it.
5. Rights wording that is not exact stays with %s. The rights check flags gaps. It does not clear them, and it does not edit audio, layout or video files.
6. Before a round, export the agenda from the menu. Pasting it is a separate act. Exporting does not send it and does not mark a change announced.
7. When a mandatory or legal line changes, update the one file in _context/, preview the sync, then apply it. Check the native file by hand.
8. Keep notices off until one computer is the designated sender and the password is outside the shared folder.

## What is still unresolved until the real job says so
Any line above that says unresolved. A walkthrough recording counts only after it is made against the pack that was actually delivered.
""" % (
        I.get("agency_name") or "unresolved",
        I.get("record_owner") or "unresolved: name the owner",
        I.get("rights_owner") or "unresolved: name who can approve rights",
        I.get("storage") or "unresolved",
        I.get("version_style") or "unresolved",
        depts, rounds,
        ", ".join(deliverables) or "unresolved",
        ", ".join(presets) or "none selected",
        proof_block, owner,
        I.get("record_owner") or "The record owner",
        I.get("rights_owner") or "the rights owner",
    )


def walkthrough(I):
    project = (I.get("first_project") or {}).get("project") or "unresolved: the first project was not named"
    client = (I.get("first_project") or {}).get("client") or "unresolved: the client was not named"
    return """# Walkthrough scaffold: %s

This is the script for a later recording of this pack. It is not the recording. Record it only against the pack that was delivered, on a real computer, after the unresolved lines that matter have been filled or left visible on purpose.

Say the agency name as it is in the intake: %s.
The first project in this pack, if one was named: %s for %s.

## Scene 1. Receive and identify
Show the delivered zip's filename. Hide tokens and contact details. Show START HERE.md and the intake summary in keystones.json. If a field is unresolved, say so.

## Scene 2. Shared context
Open the project, then _context/project.md, decisions.md, legal-lines.md and rights-and-licenses.md. Show the current version only if decisions.md names it. Otherwise say the version is unresolved.

## Scene 3. Start with a preview
Open the launcher for the computer in use. Read the runtime check out loud, including the line that says whether this is or is not a Mac or Windows acceptance. Preview before applying.

## Scene 4. One change
Use a real authorized change, or say clearly that the change is a demonstration. Show the preview, the history of the old value, and the apply. Say that a native audio, layout or video file was not edited by the script.

## Scene 5. The next decision
Build the agenda and the paste-ready export. Show owners, versions, open questions and rights flags. Say that the export was not sent and no row was marked announced.

## Scene 6. Watch and notices
Show watch starting, one unchanged check, and stopping. Notices stay off unless a designated sender was set up. Do not show a password.

## Scene 7. The next step
Show this implementation plan and the next owner. Open conditions stay visible.

A sample-only recording can sit beside this. It does not replace a recording of the delivered pack.
""" % (I.get("agency_name") or "unresolved", I.get("agency_name") or "unresolved", project, client)
