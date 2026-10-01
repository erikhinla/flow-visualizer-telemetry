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

### Decision #003 - P0 Application Boundary
**Date**: 2026-09-09
**Category**: Architecture
**Decision**: Build P0 as one Next.js App Router application. Defer an Express backend until telemetry storage, retention, and access are approved.
**Rationale**: The current repository has no backend, no application routes, and no approved telemetry destination. A single application proves the diagnostic flow without inventing infrastructure.
**Impact**: Survey answers remain in browser memory. Revision 3 output stays labeled as an illustrative scenario. No production route or deployment is part of P0.
**Status**: Active

### Decision #004 - Plain-language readout layer
**Date**: 2026-09-12
**Category**: Presentation
**Decision**: Add `src/lib/readout.ts`, a presentation-only layer that renders every completed diagnostic as six fixed sections in order: what you're feeling, what's causing it, where it's showing up, what it's costing, what matters first, what happens next. The report screen leads with these sections; the answer score and the fog pressure index move to the evidence boundary at the foot of the page.
**Rationale**: A person finishing the diagnostic should leave understanding their situation, not holding a number. Leading with "FRAGMENTED" and a 0-30 dial made the score the finding.
**Impact**: No formula, question, option identity, answer value, pressure ID, or archetype precedence changed. Each section carries the evidence class of its source (SURVEY-DERIVED, ASSUMED, ILLUSTRATIVE, PROPOSED) so a survey-derived statement is never presented as a measured business result. The cause section explains the pressure that actually resolved the archetype rather than the first pressure in question order, and states no cause at all when no pressure was triggered.
**Status**: Active

---

## Security & Compliance Notes
- All infrastructure decisions must be documented before implementation
- Credential management: NO secrets in version control (enforced by Dependabot secret scanning)
- All mathematical formulas used in scoring must be recorded with derivation
- Any deviation from established SLAs requires documented approval

---

## Future Decisions
*To be filled as the project evolves*
