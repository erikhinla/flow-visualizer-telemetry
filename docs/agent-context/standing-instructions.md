# Standing instructions

Source: root `HANDOFF.md`, `DECISION_LOG.md`, commit messages on this branch, `next.config.mjs`, tests, and the 2026-11-09 operator briefing. Where a later commit and an older note disagree, the note says so. The Operating Guide (Google Doc **TBTX Master Operating Book**) wins on buyer-facing wording. This file does not copy that document.

## Product

- The product name is PROOF. Public title in `src/app/layout.tsx`: "PROOF · See where Digital Friction shows up".
- The scan is 15 answers. Model id in code: `map-proof-2026-10-05` (`src/lib/types.ts`). Point values, choice ids, and pressure ids stay stable unless the owner approves a model change. Tests lock the 60 choice identities.
- Audiences in the flow: agency, consulting, service.
- Offer ladder in `src/components/ProofResult.tsx`: PROOF, then BACK (Context Keystones), then Remote FACT, then On-Site FACT. Value before price. BACK is the filled button on the result.
- Prices recorded in `src/lib/keystones-prices.ts`: Context Keystones intro $74 for the first 50 real purchases, then $347. Remote FACT $1,750, call first. On-Site FACT $4,500 plus travel, split $2,250 up front, $1,125 on arrival, $1,125 on completion, call first.
- FACT, in buyer-facing copy on this branch, is Friction Assessment Context Telemetry. BACK is Business Aligned Context Keystones. Commit `4d4a413` renamed client-facing "Audit" to "Assessment" and "Remote mini FACT" to "Remote FACT". Backend ids were left unchanged.
- Context Keystones means any artifact that holds context so the next person can act. Folders, Markdown, Scripts, and Protocols are the default set in the trace (Decision #007).

## Copy and visual rules recorded in root HANDOFF.md

These apply to pages, email, and visuals. Recorded 2026-10-23 in root `HANDOFF.md`, and partly checked by tests (audience wording rejects em dashes and en dashes):

- Contractions and plain speech.
- No em dashes. No en dashes in the audience wording the test covers.
- Do not use the word "free".
- Do not use the word "desk" in user-visible copy. Commit `da568b7` did that for four strings. The `?desk` query param, the `desk-open` telemetry event, CSS class names, and internal types still say desk. Leave those identifiers alone when editing copy.
- No tool names in buyer-facing copy. No rhetorical questions. No "you" or "your" in headings.
- Say "Digital Friction". The recorded ban is the word "Fog" in buyer-facing copy. Internal band id `fog` remains in `src/lib/trace.ts` and related code. The GitHub repository description still says "PROOF Fog & Friction Visualizer & Telemetry Tool".
- No URLs in visuals.
- Logo files: `public/brand/k2-tbtx-wordmark-white.png` on dark, `public/brand/k2-tbtx-wordmark-ink.png` on light. Do not retype or re-kern the wordmark. The ink file is the same artwork filled `#1F1F1F`.
- Screens are nested and click-driven, without page scroll. Root handoff says each screen should fit 390x844 and 1440x900. One headline per screen. Price and the main call to action stay in a stable place.
- Call-to-action labels match the destination. Recorded examples: Keystones "Start with PROOF", Remote FACT "Book a mini FACT call", On-Site FACT "Book a FACT call". Later commits renamed "Remote mini FACT" to "Remote FACT". Check the current component before copying a label from the 2026-10-23 note.
- Accent colors recorded in the root handoff: tbtx `#d01e98`, bbai `#b37157`, bbm `#69f2c4`, ink `#1F1F1F`, background `#E9E5DE`.

The root handoff says the long-form source of those rules is `/root/tbtx-next-ecosystem/hermes/COPY-RULES.md`, `COPY-STYLE-GUIDE.md`, and `DESIGN-GUIDE.md` on the VPS. This run did not read those files. Unverified on disk.

## Engineering

- TypeScript strict mode. Decision #001's Express-plus-Next monorepo was superseded. This tree is one Next.js app.
- `PROOF_BASE_PATH` is only `""`, `/proof/screen`, or `/proof/screen-preview`.
- Diagnostics stay off until the visitor turns them on (Decision #006). Events must match the closed schema. Batches are 1 to 40 events and at most 8,192 UTF-8 bytes. The response is the accepted count. Session inputs are not sent.
- Do not trust a submitted score or department from the client. The instrument recalculates (`DECISION_LOG.md`, 2026-10-05 product review).
- Fulfilment writes a JSON ledger under `DATA_DIR`. Do not commit that directory, `.env`, or outbox files.
- Never print, copy, or commit secret values. Names and locations only.
- Do not deploy, merge to `main`, change Stripe, change DNS, or change the live VPS as a side effect of a docs or copy task.
- Do not overwrite `erikhinla/tbtx-brain`. The briefing describes it as an Obsidian vault.
- Hermes on the VPS and Nous Cloud (`tbtx-proof-bot`) are separate installations. Telegram and Discord work is out of scope unless the owner asks for it.

## Branches that matter

- `proof-orb-approved-screens-20261104` at `ea59d8d`: approved orb screens. Not merged. Not deployed, per the operator briefing.
- `main` at `f15ad43` at audit time: a different line ("replace user-visible desk"). Do not fast-forward `main` to the approved screens, and do not fast-forward the approved screens to `main`, without an explicit owner decision.
- `live-backup-20261023`: pull request 10 merged here on 2026-11-08. Those webhook changes are not ancestors of `ea59d8d`.
