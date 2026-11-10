# PROOF: Context Computator & Friction Forensics

Standalone diagnostic for TransformBy10X. PROOF is a 15-answer screen that shows where Digital Friction shows up, then a result with the BACK (Business Aligned Context Keystones) offer, Remote FACT, and On-Site FACT. Paid Keystones checkout, intake, pack generation, and order email live in the same app.

Public URL, when the production container is the one the operator has pinned: [https://transformby10x.ai/proof/screen](https://transformby10x.ai/proof/screen).

This file restores the overview from the README that was removed in commit `0f4ab64` (that copy stopped in the middle of the install steps) and finishes the runbook against the tree on `ea59d8d`.

**Live deploy is on a Netcup VPS. Do not deploy, restart, or retag that container as part of a portability audit or a docs change.** Production, DNS, Stripe settings, and hosting stay as they are until the owner explicitly approves a deploy.

## What is in this repository

Canonical git remote: `https://github.com/erikhinla/flow-visualizer-telemetry` (GitHub search on 2026-11-10 listed this repository as public).

Application code on this line is `ea59d8d1350cc1180392ddf028db6abef40232f7` (approved Nov 4/5 orb screens, branch `proof-orb-approved-screens-20261104`). These docs were added on `portability-audit`, which starts at that commit. That commit is not on `main`. `main` at the time of this audit is `f15ad43`. The two histories diverge after `310386d`.

In git:

- Next.js App Router UI in `src/`
- Scoring, narrative, session, and fulfilment libraries in `src/lib/`
- API routes for telemetry, Stripe webhooks, Keystones, and the toolkit download
- Context Keystones pack generator in `keystones/generator/` (Python 3 standard library)
- Brand images in `public/brand/`
- Docker build and compose files
- Node tests in `tests/`
- Older notes: `HANDOFF.md` (root), `DECISION_LOG.md`, `setup.record.md`

Not in git (do not invent the contents):

- The VPS `.env` named by `docker-compose.yml` (`env_file: .env`). `.gitignore` ignores `.env*`.
- Runtime data under `DATA_DIR` (default `data/`): fulfilment ledger, Keystones zips, build counts, email outbox, and `context-gap-toolkit.zip`. `.dockerignore` excludes `data`. The toolkit route returns 503 when that zip is absent.
- Nginx site files, the live image tag, and Docker runtime state on the VPS.
- The Operating Guide. It is the Google Doc titled **TBTX Master Operating Book**, not a markdown file in this repo. See `docs/INFRA.md`.
- Copy-rule files the root `HANDOFF.md` places on the VPS under `/root/tbtx-next-ecosystem/hermes/`.

Portability notes, infrastructure, and a cold-start brief for another coding agent are in `docs/`.

## Tech stack

- Next.js 14.2.35 (App Router) and React 18. Lockfile pins Next. `package.json` allows `^14.0.0`.
- TypeScript, `strict` on. `npm run lint` is `tsc --noEmit`. There is no ESLint script.
- Tests: Node's test runner through `tsx` (`npm test`). The removed README mentioned Vitest. This repo does not use Vitest.
- Email: `nodemailer` for SMTP, or the Resend HTTP API when `RESEND_API_KEY` is set. No Stripe SDK. The webhook checks the Stripe signature in `src/lib/fulfil.ts` and calls the Stripe HTTP API only to deactivate the intro payment link.
- Keystones packs: Python 3.8+ standard library, `keystones/generator/generate.py`. The production image installs `python3` on Alpine.
- Container: multi-stage `Dockerfile` from `node:18-alpine`. `next.config.mjs` does not set `output: 'standalone'`. The image runs `npm start` (`next start`) and copies `node_modules`, `.next`, `public`, and `keystones/`.
- Fonts at build time, from Google, via `next/font/google`: Archivo, Barlow, Barlow Condensed, IBM Plex Mono, Inter Tight.
- Subpath: `PROOF_BASE_PATH` must be empty, `/proof/screen`, or `/proof/screen-preview`. Anything else throws at config load. Production compose sets `/proof/screen`.

Session answers stay in the browser (`localStorage` key `flow.visualizer.session.v1`). The server keeps paid-order state in JSON files on disk. Telemetry, when the visitor opts in, is a process-memory buffer on `POST /api/telemetry` and is dropped on restart.

## Prerequisites

- Node.js 18 or newer, and npm. The image is Node 18. This audit ran the tests on Node v22.23.4.
- Python 3 only if you generate a Keystones pack. The UI tests do not need it.
- A local `.env` only if you exercise email or the Stripe webhook. The questionnaire runs without it.

## Install

```bash
npm ci
```

`npm ci` is the right install because `package-lock.json` is committed. On 2026-11-10 it reported 3 dependency vulnerabilities (2 high, 1 critical) and said a fix would be a breaking upgrade. This audit did not upgrade Next or nodemailer.

## Run locally

```bash
npm run dev
```

`predev` regenerates `public/proof-scan.mjs` and `public/proof-scan-contract.json` from `src/lib/scan-contract.ts`. Open [http://localhost:3000](http://localhost:3000).

To match the production subpath:

```bash
PROOF_BASE_PATH=/proof/screen npm run dev
```

Then open [http://localhost:3000/proof/screen](http://localhost:3000/proof/screen).

Optional build-time booking URL (becomes `NEXT_PUBLIC_PROOF_BOOKING_URL`):

```bash
PROOF_BASE_PATH=/proof/screen PROOF_BOOKING_URL='https://calendar.app.google/example' npm run dev
```

Use a placeholder host in local experiments. Do not point a local webhook at the live Stripe endpoint.

Routes, before `basePath` is prefixed:

| Path | What it is |
| --- | --- |
| `/` | PROOF intro, 15 answers, result (`src/components/ProofFlow.tsx`) |
| `/map` | Same flow, opened on the questions |
| `/keystones` | Paid Context Keystones intake |
| `/visualizer` | Team model |
| `/record` | Portable record |
| `/offer` | Older "talk through the pattern" page |
| `/api/telemetry` | Opt-in diagnostic batches |
| `/api/stripe/webhook` | Stripe signature check and fulfilment |
| `/api/keystones`, `/api/keystones/checkout`, `/api/keystones/download`, `/api/keystones/offer` | Pack build, checkout state, zip download |
| `/api/toolkit` | Toolkit zip from `DATA_DIR`, if that file exists on disk |

`/` and `/map` use the full-screen PROOF shell. Other pages use the header in `src/components/Shell.tsx`.

Preview compose (local only, not a production command): `docker-compose.preview.yml` builds with `PROOF_BASE_PATH=/proof/screen-preview` and publishes `127.0.0.1:3003:3000`. It has no `env_file`, so mail falls through to the outbox and the webhook rejects unsigned calls.

## Build

```bash
PROOF_BASE_PATH=/proof/screen npm run build
npm start
```

`prebuild` runs the same scan export as `predev`. `npm start` serves the production build on port 3000.

Container image, still local, still not a deploy:

```bash
docker build --build-arg PROOF_BASE_PATH=/proof/screen -t proof-local:audit .
```

Do not tag or push `proof-release:*`. The operator briefing names the live image as `proof-release:20261105`. This repo's compose file does not pin that tag.

## Test

```bash
npm test
npx tsc --noEmit
```

`npm test` runs `tsx --test tests/*.test.ts`. On 2026-11-10, on this commit, that was 55 tests, 0 failures. `tsc --noEmit` exited 0. There is no browser test runner in this repo. Python generator tests are not in this checkout (an older branch message mentioned them; this tree has no `test_*.py`).

Walk the product after a UI change: start PROOF, answer all 15, and open the result on a narrow viewport (the phone layout is `max-width: 900px`) and on a desktop width. Confirm the logo is the image file `public/brand/k2-tbtx-wordmark-white.png` or `k2-tbtx-wordmark-ink.png`, not retyped lettering.

## Environment variable names

Values stay in the VPS `.env` or your local untracked `.env`. Names only:

| Name | Role |
| --- | --- |
| `PROOF_BASE_PATH` | Build arg and runtime base path. Allowlist in `next.config.mjs`. |
| `PROOF_BOOKING_URL` | Build arg. Copied to `NEXT_PUBLIC_PROOF_BOOKING_URL`. |
| `NEXT_PUBLIC_PROOF_BASE_PATH` | Set by Next config from `PROOF_BASE_PATH`. |
| `NEXT_PUBLIC_PROOF_BOOKING_URL` | Booking link override. Empty falls back to the URL in `src/lib/links.ts`. |
| `NEXT_PUBLIC_PROOF_NOINDEX` | Set by Next config when the base path is the preview path. |
| `NODE_ENV` | `production` in the image and compose. |
| `DATA_DIR` | Ledger, zips, outbox. Default: `data` under the working directory. Compose mounts `./data` at `/app/data`. |
| `PUBLIC_BASE_URL` | Absolute origin for links in email. Default in code: `https://transformby10x.ai/proof/screen`. |
| `NOTIFY_EMAIL` | Operator mailbox for failure notices. Default in code: `erik@transformby10x.ai`. |
| `MAIL_FROM` | From header for Resend or SMTP. |
| `RESEND_API_KEY` | Resend. When set, SMTP is not used. |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_PORT` | SMTP fallback. Port defaults to 465. |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature. Empty secret rejects every event. |
| `STRIPE_LINK_KEY` | Restricted key used only to set the intro payment link inactive at 50 real sales. |
| `KEYSTONES_GENERATOR` | Path to `generate.py`. Default: `keystones/generator/generate.py`. |
| `KEYSTONES_PYTHON` | Python binary. Default: `python3`. |

`docker-compose.yml` also interpolates `PROOF_BOOKING_URL` as a build arg if it is already in the shell environment.

A later branch (`cursor/back-checkout-value-4b40`, pull request 10, merged only onto `live-backup-20261023`) reads `STRIPE_CHECKOUT_READ_KEY` or `STRIPE_SECRET_KEY`. Those names are absent from this checkout.

The root `HANDOFF.md` env list omits `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `PROOF_BASE_PATH`, and `PROOF_BOOKING_URL`. Trust the table above for this commit.

## Deploy

Do not run a deploy from this audit, from a docs pull request, or from a fresh checkout unless the owner has explicitly approved that deploy. The live site is the Netcup VPS, not Vercel. Vercel has a linked project id in `.vercel/project.json` from an older "let Hermes manage it" commit. Decision #003 in `DECISION_LOG.md` had already declined a Cloud Run and Vercel rollout. `setup.record.md` (2026-09-09) still describes a GCP plan that was not the path that shipped.

Recorded procedure, from the root `HANDOFF.md`, for a future approved deploy only. This audit did not SSH to the VPS and did not verify the paths:

1. On the VPS, back up source and tag the current image before changing it.
2. Run `npm ci` and `npm test` in a throwaway container.
3. `docker compose build proof-app && docker compose up -d proof-app` from `/root/flow-visualizer-telemetry`, with the gitignored `.env` beside the compose file.

Operator briefing (2026-11-09, unverified here): the live container was still image `proof-release:20261105`, restored after a wrong-screen deploy. The approved screens on this branch were not merged and not deployed. Pull request 10's webhook changes are not in this commit.

## More detail

- Cold start for another coding agent: `docs/HANDOFF.md`
- Accounts, secrets by name, sibling repos: `docs/INFRA.md`
- What is portable and what is at risk: `docs/PORTABILITY-AUDIT.md`
- Standing rules, decisions, recurring work, fragile spots: `docs/agent-context/`
- Older operator note, including copy rules and 2026-10-23 open items: `HANDOFF.md` at the repo root. Some of those items have since moved. The Google Doc is the narrative canon.
