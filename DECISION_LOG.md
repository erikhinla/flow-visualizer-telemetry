# Decision Log

## Overview

This document serves as the immutable record of all approved deviations, mathematical formulas, infrastructure constraints, and significant architectural decisions for the FLOW Blueprint Visualizer & Telemetry Tool.

## Decision Format

Each entry includes:

- **Date**: Decision date
- **Category**: Type of decision (Architecture, Security, Infrastructure, Scoring, etc.)
- **Decision**: The approved change or deviation
- **Rationale**: Why this decision was made
- **Impact**: How this affects the system
- **Status**: Active/Deprecated/Superseded

---

## Decisions

### Decision #001 - Repository Structure

**Date**: 2026-09-09  
**Category**: Architecture  
**Decision**: TypeScript monorepo with Express backend and Next.js frontend separation  
**Rationale**: Type safety, developer experience, and scalability for FLOW Blueprint visualization  
**Impact**: All future code contributions must follow TypeScript strict mode  
**Status**: Superseded by Decision #003

### Decision #002 - Telemetry Collection Strategy

**Date**: 2026-09-09  
**Category**: Diagnostic  
**Decision**: Client-side telemetry collection with server-side aggregation  
**Rationale**: Real-time diagnostics and performance monitoring for FLOW applications  
**Impact**: All telemetry data flows through designated collection endpoints  
**Status**: Superseded by Decision #003

---

## Security & Compliance Notes

- All infrastructure decisions must be documented before implementation
- Credential management: NO secrets in version control (enforced by Dependabot secret scanning)
- All mathematical formulas used in scoring must be recorded with derivation
- Any deviation from established SLAs requires documented approval

---

### Decision #003 - Standalone Visualizer

**Date**: 2026-10-01  
**Category**: Architecture  
**Decision**: Deliver the Visualizer as a standalone Next.js application. Operational repair-hour accounting is the working measurement. The revision-3 manifestation index stays in the calculation inspector, labeled as an uncalibrated scenario. No GCP project, Secret Manager, or Cloud Run deployment is provisioned.  
**Rationale**: The owner asked for a finished standalone app. Prod project id, safeguard confirmation, and Vercel settings in the setup record were never supplied. The master document's acceptance path is an inspectable workflow model, not a cloud deployment.  
**Impact**: Session state lives in the browser. Telemetry accepts batches at `/api/telemetry` and holds them in process memory only. External campaign routes remain references inside the record, not live destinations.  
**Status**: Active

---

### Decision #004 - PROOF for marketing agencies

**Date**: 2026-10-01  
**Category**: Product  
**Decision**: The product name is PROOF. The scan, desks, and record speak to a marketing agency: campaign momentum, reconstruction hours, and a fix judged by hours returned, hours the fix costs, the review that stays, and the client result that must hold. Question point values and pressure ids stay as saved on 6 September 2026. Wording asks about briefs, desks, flights, and client delivery.  
**Rationale**: A general business instrument did not tell an agency where hours leave the craft, whether the next launch can still make it, or whether a solution would trade away approval, direction, rights, or a human read of spend.  
**Impact**: Navigation reads Scan, Desk, and Record. Each desk carries a balance: where hours go, what review stays, and what result to protect. A negative net is shown as a reason not to add the connection.  
**Status**: Active

---

### Decision #005 - Trace and the quad keystones

**Date**: 2026-10-01  
**Category**: Product  
**Decision**: After a desk scenario is known, PROOF shows a rebuild path on the quad keystones: Folders, Markdown, Scripts, and Protocols. The Trace reads four facts — where the project is, what needs done, who is doing it, and by when — from the existing display band. Unknown and zero-capacity desks stay untraced. Keystone actions are hidden on screen until the scenario is known. The downloaded record keeps the planned actions and a complete flag.  
**Rationale**: Agencies asked for the operating context fog and friction erase, and a visible path to put that foundation back. The keystones already had this meaning in the master document. They were supporting concepts, not the opening pitch. They are now the close of the Trace.  
**Impact**: Navigation reads Scan, Trace, and Record. Sample desks are known, so their stones are visible and labeled simulated. Clearing an input locks the stones. Scoring, repair-hour accounting, and the revision-3 index are unchanged.  
**Status**: Active (terminology superseded by Decision #007)

---

### Decision #006 - Diagnostics are opt-in

**Date**: 2026-10-04  
**Category**: Diagnostic  
**Decision**: Diagnostics stay off until the visitor turns them on. A batch is accepted only when every event matches the closed schema, the batch holds 1 to 40 events, and the body is at most 8,192 UTF-8 octets. The response is `{ accepted }` and does not include the buffer length.  
**Rationale**: The route was accepting arbitrary events, and the buffer length leaked other requests. Record was posting on arrival.  
**Impact**: `POST /api/telemetry` rejects a bad batch with nothing stored. The footer control is the only switch. Session inputs are not sent.  
**Status**: Active

---

### Decision #007 - Context Keystones, principle-first

**Date**: 2026-10-19  
**Category**: Product  
**Decision**: A context keystone is any artifact that holds the context a team needs so the next person or agent can act without rebuilding it. Folders, Markdown, Scripts, and Protocols are the default starting set in the Trace. PDFs, Google Docs, spreadsheets, locked Figma versions, decision logs, and named masters with rights and approval records also qualify. Test: if losing it would push someone into chasing and reconstructing context, it's a keystone.  
**Rationale**: Aligns the repo with the TBTX canon in the Context-Coordination-Map vault (Context-Keystones, Handoff-2026-10-12).  
**Impact**: Wording only. Trace logic, scoring, and the four default stones stay the same.  
**Status**: Active

---

## Future Decisions

_To be filled as the project evolves_


### 2026-10-05 - PR #4 audit corrections

The questionnaire model remains `map-saved-2026-09-06`. Point values, option and pressure IDs, profile boundaries, and archetype precedence are unchanged. The first four prioritized pressures still determine routing. `allPressures` retains the full prioritized list for the portable record; it does not widen archetype selection.

The foundation complete flag now follows the existing trace state. An unavailable or unknown desk exports `complete: false` with `state: untraced`.

Regression fixtures cover all 60 option identities, the documented isolated-answer archetypes, fifth-pressure retention without a routing change, unknown and zero-capacity records, and positive/negative/unknown account balances. The recovered local snapshot already guards storage writes, preserves decimal drafts, and labels unknown waits Unknown; those fixes remain covered by tests and browser checks.

Public prices are removed, with no replacement price. Public questionnaire references read Fifteen Answers. The homepage account-sample link selects ACC rather than PR.

Source provenance: main at e68df29 lacks the public offer, evidence controls, and yes/no presentation found on production. A separate recovery commit captures the application source from `/Users/test/Documents/flow-visualizer-telemetry-main`. Production page content matches this snapshot in inspected areas, but exact deployment revision remains unverified because the Vercel connector denied access to the project scope. This is a review blocker, not a claim of a canonical source update.

### 2026-10-05 - Product review: one Scan and completed-answer handoff

The owner's Oct 5 product decisions supersede the earlier first-four archetype limitation. `map-proof-2026-10-05` preserves question/choice IDs, point values, bands, and precedence but selects the archetype from all prioritized pressures. Empty pressure sets return null rather than fragmentedWorkflow. Display retains the first four; the record retains all.

Completed handoffs carry canonical choice IDs and the model version. Both surfaces can consume the same generated browser module. The instrument validates the payload and recalculates it, opens the existing suggested function sample, and marks the Scan completed. No submitted score or department is trusted. No-pressure results open their completed reading. Invalid payloads open a fresh Scan. Counts remain simulated until independently entered under the existing evidence controls.

Subpath support uses build-time PROOF_BASE_PATH=/proof/screen, Next.js basePath, and a prefixed raw API fetch. Company rewrites and film consumption remain unimplemented.

No further copy lines are approved in /Users/test/Downloads/copy-decisions.md. I changed no visible wording to its proposals. Q4/Q8 inversion and non-monotonicity in manifestation-revision-3 remain open because the approved replacement formula is unspecified. Questionnaire point monotonicity is verified separately; it does not certify that illustration.
