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
**Status**: Active

### Decision #002 - Telemetry Collection Strategy

**Date**: 2026-09-09  
**Category**: Diagnostic  
**Decision**: Client-side telemetry collection with server-side aggregation  
**Rationale**: Real-time diagnostics and performance monitoring for FLOW applications  
**Impact**: All telemetry data flows through designated collection endpoints  
**Status**: Active

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
**Status**: Active

---

## Future Decisions

_To be filled as the project evolves_
