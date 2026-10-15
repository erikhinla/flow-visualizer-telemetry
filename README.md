# PROOF: Context Computator & Friction Forensics

> Standalone diagnostic instrument and operational friction engine for measuring context coordination gaps and capacity pressure.

---

## Overview

**PROOF: Context Computator & Friction Forensics** exposes and quantifies human repair work (searching, chasing, checking, rebuilding) between departmental handoffs. It uses a 15-question Momentum Map diagnostic engine (`map-proof-2026-10-05`) and contract payloads to trace recurring tasks from request to completion.

### Key Capabilities
- **15-Question Diagnostic Engine:** Maps answer patterns to specific operational pressure signals.
- **Contract & Handoff Module:** Decodes and validates versioned URL payloads (`/proof/screen/visualizer#proof=<payload>`).
- **Subpath Hosting Support:** Designed for subpath routing under `/proof/screen`.
- **Hermes Agent Ready:** Configured for local automated management and deployment via Hermes Agent on a self-hosted Netcup VPS.

---

## Tech Stack & Architecture

- **Framework:** Next.js (App Router, Node.js standalone build target)
- **Language:** TypeScript
- **Testing:** Vitest / Node Test Runner (`npm run test`)
- **Containerization:** Docker & Docker Compose
- **Hosting Environment:** Netcup VPS (Self-Hosted)

---

## Deployment Architecture (Netcup VPS & Hermes Agent)

This project is configured to run in a standalone Docker container on a self-hosted **Netcup VPS**. It does **not** rely on third-party PaaS platforms (such as Vercel).

### Why Netcup VPS + Hermes Agent?
- **Hermes Agent Integration:** Hermes Agent manages, inspects, and executes deployments on the VPS environment via local script and SSH access.
- **Full Control & Low Latency:** Dockerized standalone output guarantees zero external deployment dependencies and consistent subpath routing (`/proof/screen`).

---

## Local Development & Setup

### Prerequisites
- Node.js 18+ or 20+
- npm 9+

### Quick Start

1. **Install dependencies:**
   ```bash
   npm install
