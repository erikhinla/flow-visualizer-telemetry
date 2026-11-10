# Decisions

The immutable log in the repo is `DECISION_LOG.md`. It stops at the 2026-10-05 product review. Later decisions below are taken from commits, `Dockerfile`, compose files, root `HANDOFF.md`, and the operator briefing. This file does not add decisions the repo does not support.

## From DECISION_LOG.md

| Id | Date | Status | What was decided |
| --- | --- | --- | --- |
| #001 | 2026-09-09 | Superseded by #003 | TypeScript monorepo with an Express API and a Next.js frontend. |
| #002 | 2026-09-09 | Superseded by #003 | Client telemetry with server aggregation. |
| #003 | 2026-10-01 | Active in the log | Standalone Next.js app. Repair-hour accounting is the working measurement. The revision-3 manifestation index stays in the inspector and is labeled uncalibrated. No GCP project, Secret Manager, or Cloud Run was provisioned. Session state in the browser. `POST /api/telemetry` holds batches in process memory. The owner had not supplied a prod project id or Vercel settings, and the acceptance path was an inspectable model. |
| #004 | 2026-10-01 | Active, wording later edited | Product name PROOF, aimed at a marketing agency. Question points and pressure ids stay as saved on 6 September 2026. |
| #005 | 2026-10-01 | Terminology superseded by #007 | After a scenario is known, show a rebuild path on four keystones and four facts (where, what, who, when). |
| #006 | 2026-10-04 | Active | Diagnostics opt-in. Closed schema, 1 to 40 events, 8,192 byte cap, response `{ accepted }` style (the route now returns the accepted count). |
| #007 | 2026-10-19 | Active | "Context keystone" is any artifact that holds context. The four default stones stay. Wording only. |

Also recorded in that file, 2026-10-05:

- Pull request 4 kept model `map-saved-2026-09-06` identities. The owner's same-day product review then superseded the "first four pressures only" routing rule. `map-proof-2026-10-05` selects the archetype from all prioritized pressures. Display still keeps the first four. The record keeps all.
- Completed handoffs carry canonical choice ids and the model version. The server recalculates. Invalid payloads open a fresh scan.
- Subpath support is build-time `PROOF_BASE_PATH=/proof/screen`, Next.js `basePath`, and a prefixed fetch.
- Q4/Q8 inversion and non-monotonicity in `manifestation-revision-3` stayed open because no replacement formula was approved. Questionnaire point monotonicity is a separate check and does not certify that index.
- `setup.record.md` still lists GCP org `321138999503`, billing account name `BBAI-FBP`, dev project id `project-4815ed48-b090-4e68-878`, region `us-east4`, and target URL `https://transformby10x.ai/tbtx/bbai/fbp`. Decision #003 says that cloud path was not provisioned. Commit `7500ec9` later edits the GCP region to `us-central1` inside the historical setup material. Treat `setup.record.md` as a 2026-09-09 planning record, not as the live host.

## Later decisions this repo does support

**Live host is a Netcup VPS with Docker, not the GCP plan.** Root `HANDOFF.md` and the `Dockerfile` describe `/root/flow-visualizer-telemetry`, compose service `proof-app`, port 3000, public base path `/proof/screen`. The operator briefing (2026-11-09) says the same host family and says Vercel was only used for previews. This run did not SSH, so the live process is unverified. Commit `e68df29` ("Link the Vercel project so Hermes can manage it") committed `.vercel/project.json`. That link exists in git. It is not the compose deploy path.

**Scoring contract stays put while copy moves.** A series of "Scope A" commits on this branch change buyer-facing words and leave template ids, Stripe link keys, and the `?desk` parameter in place. Examples: Context Gap, then Context Rot (`adb67f1`), then Context Erosion (`605cfb3`); FACT spelled out (`99c9055`, `4d4a413`); user-visible "desk" removed (`da568b7`).

**One screen at a time.** Commits from `fe10a1f` onward make results a sequence of screens, with phone-specific question layout (`09ae702`, max-width 900px) and approved orb screens captured in `ea59d8d`.

**Keystones fulfilment is in this app.** Webhook, intro cap of 50, five builds per purchase, 24-hour zip links, and the Python generator are in this tree as of `ad30243` and later. Pull request 10 (merged 2026-11-08 onto `live-backup-20261023` only) tightens the webhook so a paid session is re-read from Stripe before it unlocks a build. That code is not in `ea59d8d`. The operator briefing says not to re-merge it onto the approved screens as part of routine work. Do not do that unless the owner asks.

**Approved screens are a branch, not production.** `ea59d8d` on `proof-orb-approved-screens-20261104` records screens that had been uncommitted on `7abb993`. The briefing says they are not deployed. The briefing also says the live image on 2026-11-09 was `proof-release:20261105`. Unverified here.

**Narrative canon is the Google Doc.** Briefing and this audit's Drive read agree the operating book is not a git markdown master. See `docs/INFRA.md`.
