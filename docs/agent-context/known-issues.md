# Known issues and fragile areas

Recorded so the next agent does not "fix" them by surprise. Do not rewrite live copy, Stripe, or the VPS while reading this list.

## This checkout versus production

- Approved screens are `ea59d8d` on `proof-orb-approved-screens-20261104`. The operator briefing says they are not deployed.
- `main` (`f15ad43`) and this branch diverged after `310386d`. Each side has commits the other lacks (2 on `main`, 21 on this branch, counted with `git rev-list --left-right --count main...HEAD` during the audit).
- Pull request 10 is merged to `live-backup-20261023` and is not an ancestor of `ea59d8d`. This branch's webhook entitles a Keystones build from the signed event plus amount and payment-link checks in `src/app/api/stripe/webhook/route.ts`. The other branch re-fetches the Checkout Session before it unlocks a build. Shipping the approved screens without that retrieve, or shipping the retrieve without the approved screens, are both owner decisions.
- `docker-compose.yml` builds from the local Dockerfile and names the container `flow-visualizer-telemetry`. It does not pin image `proof-release:20261105`. The briefing says that tag is what was running. Unverified.

## Data that a restart or a lost disk does not forgive

- `DATA_DIR` holds the paid-order ledger, the intro-sale count, build counters, and zips. Losing it loses the record of who paid and how many intro sales have already counted. Git does not contain it.
- `context-gap-toolkit.zip` is read by `src/app/api/toolkit/route.ts` and is not in the repository. A fresh checkout returns 503 for that download.
- Telemetry is an in-memory array capped at 200 events (`src/app/api/telemetry/route.ts`). A restart clears it. It is not a database.
- Email with no Resend key and no SMTP is an outbox file on disk. Tests in this audit wrote those files under the test's own temp dir, not into the repo.

## Scoring and formulas

- `manifestation-revision-3` is an uncalibrated scenario index (`src/lib/manifestation.ts`). Decision log: Q4/Q8 inversion and non-monotonicity stayed open because no replacement formula was approved.
- Changing a point value or a choice id breaks the film handoff and the regression tests on purpose.
- Root `HANDOFF.md` and the code disagree on the booking link. On-site FACT in `src/components/ProofResult.tsx` uses `https://calendar.app.google/Xu3RZNM4nEuATHee7`. `src/lib/links.ts` falls back to `https://calendar.app.google/GUyyj5aXpiarDWpg6` when `PROOF_BOOKING_URL` is empty. Root `HANDOFF.md` says both calls use `https://calendar.app.google/4mgKAmouyucz7jk79`. The production image bakes `PROOF_BOOKING_URL` at build time. Which URL the live container has is unverified.

## Copy the briefing says is still in circulation

Searched this checkout, including history with `git log -S`. Current source has neither "The world built the generator" nor "See BizBot Mrktng". "BizBot" appears only in older commits. Story screen 01 in `src/components/ProofFlow.tsx` is titled "Context Erosion", not "The spine".

The briefing (2026-11-09) says those stale pages are still in circulation, including a truncated "See BizBot Mrktng" link on "What happens after PROOF". This audit did not fetch the live site and did not edit sibling repos. Leave the lines alone until the owner asks for a copy change. They may live on the home or offers site, which are other repositories.

Root `HANDOFF.md` also lists, as of 2026-10-23: test promotion codes still active, `STRIPE_LINK_KEY` unset, a coupon that could only be deleted, Resend templates unpublished, a long `/about` page via "The longer story", and small "TBTX" text tags on a home-page list. This checkout has no `/about` route and no "longer story" string. The Stripe and Resend items were not rechecked in those dashboards. The promotion code names stay in the root handoff and are not repeated here.

## Privacy and terms

The PROOF footer opens a sheet (`src/components/ProofFlow.tsx`): answers stay in the browser, and opt-in diagnostics send the page and the step, not the answers. That is the only privacy statement in this repo. There is no `/privacy` or `/terms` route. The header on `/visualizer` and `/record` does not link to that sheet.

Keystones intake asks the buyer for their own legal lines (labels include "Offer terms" and "Disclaimer"). That is pack content, not a TransformBy10X policy.

The briefing says a privacy statement was not found on the public site's navigation. This repo cannot prove what the live marketing nav shows.

## Dependency and history risk

- `npm ci` on 2026-11-10 reported 3 vulnerabilities (2 high, 1 critical) and said the fix is a breaking upgrade. Not upgraded here.
- `.env.record` was committed, then deleted in `0f4ab64`. The blob is still in git history. Keys that had non-empty values: `GCP_PROJECT_ID`, `GCP_REGION`, `GCP_SERVICE_ACCOUNT_EMAIL`, `DEPLOY_TARGET`, `TARGET_DOMAIN`, `TELEMETRY_ENABLED`, `DIAGNOSTIC_MODE`, `VISUALIZER_VARIANT`. This audit did not print the values. A pattern scan of history found no live Stripe secret key, live restricted key, Resend API key, GitHub personal access token, or private-key block. `tests/keystones.test.ts` uses obvious placeholder webhook and restricted-key strings.
- Payment-link ids, price ids, and Resend template UUIDs are in source. The GitHub repository was listed as public on 2026-11-10. Those identifiers are therefore world-readable. They are not API secrets. They do identify the Stripe catalog and the Resend templates.
- `.vercel/project.json` commits a Vercel org id and project id.
- `Dockerfile.bak-prerunnerarg-20261020-2342` is an old Dockerfile left in the tree. The live build file is `Dockerfile`.
- `README.md` was missing from `0f4ab64` until this audit restored a runbook.

## Host files this repo cannot rebuild by itself

Nginx (`/etc/nginx/sites-available/proof` is the example in the briefing), TLS certificates, the VPS `.env`, SSH keys, Docker image tags, preview trees at `/srv/www/tbtx-preview/`, and `proof-orb-preview` containers. All unverified this run. Listed so a restore from git alone is not mistaken for a full restore.
