# Handoff: PROOF diagnostic app

One-page brief for a coding agent that has only this git repo. The older operator note is the root `HANDOFF.md` (open items dated 2026-10-23). Read both. When they disagree, prefer this checkout's code, then the Google Doc for buyer-facing narrative.

## Goal

PROOF is the TransformBy10X 15-answer diagnostic at `https://transformby10x.ai/proof/screen`. It shows where Digital Friction shows up, then offers BACK (Context Keystones), Remote FACT, and On-Site FACT. The same Next.js app scores the answers, takes Stripe webhooks, builds the Keystones zip, and sends order email.

The owner-approved orb screens are commit `ea59d8d` on `proof-orb-approved-screens-20261104`. They are not what `main` points at, and the operator said they are not what production is running.

## Architecture

Browser session (`localStorage`) holds answers. Next.js App Router renders the screens and the API. `PROOF_BASE_PATH=/proof/screen` is baked at build time. Docker on a Netcup VPS runs `next start` on port 3000. Nginx on that VPS, not in git, is what the public hostname hits. Paid state is JSON on a `data` volume. There is no application database. Email is Resend, else SMTP, else an on-disk outbox. The Keystones pack is `keystones/generator/generate.py`.

Scoring model id: `map-proof-2026-10-05`. Do not change choice ids or point values in a copy edit.

## Five places to open first

1. `src/components/ProofFlow.tsx`: intro, 15 answers, privacy sheet, story.
2. `src/components/ProofResult.tsx`: result screens and the offer ladder.
3. `src/lib/questionnaire.ts` and `src/lib/math.ts`: the locked scoring contract.
4. `src/app/api/stripe/webhook/route.ts`, `src/lib/keystones-server.ts`, `src/lib/fulfil.ts`: payment, cap, ledger, email.
5. `Dockerfile`, `docker-compose.yml`, `next.config.mjs`, and `keystones/generator/`: how it builds and how a pack is produced.

## Verify a change

```bash
npm ci
npm test
npx tsc --noEmit
PROOF_BASE_PATH=/proof/screen npm run dev
```

On `ea59d8d`, `npm test` was 55 passing and `tsc --noEmit` was clean. Then click through all 15 answers to the result at a width under 900px and at a desktop width. Confirm logos are the PNG files in `public/brand/`, not typed text.

Do not call the live Stripe webhook, do not check out with a real card, and do not deploy.

## Do

- Keep secrets out of git, logs, and chat. Record names and file paths.
- Keep backend ids stable when the task is copy: choice ids, `?desk`, telemetry event names, Resend template ids, Stripe ids.
- Put buyer-facing narrative changes against the Operating Guide, the Google Doc **TBTX Master Operating Book**: https://docs.google.com/document/d/1c7cvhp6Vi1TjPFYt0SGPEmuuSCml4PeK2CMooONNoA0/edit
- Follow the copy rules in root `HANDOFF.md` and `docs/agent-context/standing-instructions.md`.
- Leave `erikhinla/tbtx-brain` alone. It is a separate vault.
- Read `docs/PORTABILITY-AUDIT.md` before assuming the VPS, DNS, or Stripe match this branch.

## Do not

- Do not deploy, restart, or retag the Netcup container without an explicit owner approval. Live hosting is that VPS. A docs merge is not approval.
- Do not change Stripe: no new prices, no deactivated links, no webhook edits in the dashboard, no key rotation.
- Do not merge this branch to `main`, and do not merge `main` or pull request 10 onto the approved screens, unless the owner asks for that merge in writing.
- Do not change production DNS, Nginx, or hosting settings.
- Do not force-push, delete history, or rewrite `main`.
- Do not treat root `HANDOFF.md` booking URLs or its 2026-10-23 open items as current without checking the code. Three booking URLs disagree today. See `docs/agent-context/known-issues.md`.
- Do not copy the Operating Guide into git as a second master.
