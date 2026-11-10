# Infrastructure and accounts

Audit date 2026-11-10. Scope is the PROOF app in `erikhinla/flow-visualizer-telemetry`, plus the sibling list the operator briefing asked to inventory. "Verified" means this run saw it in git, in the GitHub API, or in the Google Drive API. "Operator briefing" means the 2026-11-09 brief. This run had no SSH to the VPS and changed no live setting.

Secret values are not written here. A history scan for live Stripe secret keys, live restricted keys, Resend keys, GitHub personal access tokens, and private-key blocks found none of those patterns in git. Placeholder strings in `tests/keystones.test.ts` are fixtures.

## How the app is hosted

| Piece | What the repo and briefing support | Account | How to reach it without Cursor |
| --- | --- | --- | --- |
| Live HTTP | Operator briefing: Netcup VPS, not Vercel, for `transformby10x.ai` and `erikhbush.com`. Root `HANDOFF.md`: `root@159.195.251.226`, app path `/root/flow-visualizer-telemetry`, compose service `proof-app`, container port 3000, public `https://transformby10x.ai/proof/screen/`. SSH key kept on Erik's Mac (handoff text). Unverified this run. | Netcup account. Owner not named beyond the briefing and the handoff's "Erik". Not provisioned by Cursor in this repo. | Netcup customer control panel, plus SSH as recorded in the root handoff. This audit did not connect. |
| Reverse proxy and TLS | Briefing: Nginx site files on the VPS, example `/etc/nginx/sites-available/proof`. Not in git. Unverified. | Same VPS. | SSH, then the Nginx files on the machine. |
| App process | `Dockerfile` plus `docker-compose.yml`. Image base `node:18-alpine`. Compose publishes `3000:3000`, reads `env_file: .env`, mounts `./data:/app/data`. Container name in compose: `flow-visualizer-telemetry`. | Built on the VPS from this repo. | `docker compose` on the VPS. Do not run it from a docs change. |
| Live image tag | Briefing: `proof-release:20261105` since 6:42:50 AM ET on 9 Nov 2026, after a wrong-screen deploy was restored. Unverified. The compose file does not pin that tag. | VPS Docker. | `docker images` on the VPS. |
| Preview | `docker-compose.preview.yml`: service `proof-orb-preview`, base path `/proof/screen-preview`, `127.0.0.1:3003:3000`, volume `./data-preview`. Briefing: preview trees historically at `/srv/www/tbtx-preview/`. Unverified on the host. | Same VPS. | Compose file in git. Host directories unverified. |
| Vercel | `.vercel/project.json` is committed (org id and project id). Commit `e68df29` says the link exists so Hermes can manage the project. Decision #003 declined a Vercel rollout. Briefing: Vercel was for previews only. Whether the project still exists was not checked in the Vercel API. | Vercel team recorded only by the ids in that JSON. Owner login was not looked up. | Vercel dashboard, project id from `.vercel/project.json`. |
| GCP | `setup.record.md` plans org `321138999503`, billing account name `BBAI-FBP`, dev project `project-4815ed48-b090-4e68-878`, region later edited toward `us-central1`. Decision #003 says no GCP deploy was provisioned. No `gcloud` config is in this checkout. | Unknown whether those projects still exist. | Google Cloud console, if the owner still has them. Do not treat them as production. |

## Domain, DNS, database, storage, email

| Service | Finding | Account | Direct access |
| --- | --- | --- | --- |
| Domain `transformby10x.ai` | Used throughout the app as the public origin. Registrar is not in the repo or the briefing. | Unknown. Question for the owner. | Whoever holds the registrar login. |
| Domain `erikhbush.com` | Briefing: personal site, adjacent, repo `erikhinla/erikhbush.com`. Not served by this PROOF repo. | Unknown registrar. | That repo and the registrar. |
| DNS | Not in git. Briefing implies the VPS answers for the live sites (Nginx). DNS host may be the registrar, Netcup, or something else. Unverified. | Unknown. | DNS host plus Nginx on the VPS. |
| Database | No database client in `package.json`. Paid state is JSON files in `DATA_DIR`. Telemetry is process memory. | The VPS disk. | The `data` volume on the server. |
| File storage | Brand images are in `public/brand/`. Generated zips and the toolkit zip sit on the data volume, not in git. No S3, Blob, or similar SDK. | VPS disk. | SSH and `DATA_DIR`. |
| Google Drive canon | Verified via Drive API this session. Document title **TBTX Master Operating Book**, id `1c7cvhp6Vi1TjPFYt0SGPEmuuSCml4PeK2CMooONNoA0`, modified 2026-11-07. Path: folder `Drive` (`0AOQRoUJoW_EtUk9PVA`) / `01_COMPANY` / `Docs`. The connected Drive user on that file is Erik H Bush, `erik@transformby10x.ai`. The briefing calls this the Operating Guide. Body was not copied into git. | Google account `erik@transformby10x.ai`. This session's Drive connection is that account, not a separate Cursor-provisioned mailbox. | [The document](https://docs.google.com/document/d/1c7cvhp6Vi1TjPFYt0SGPEmuuSCml4PeK2CMooONNoA0/edit). |
| Email send | Resend HTTP API, else SMTP via nodemailer, else `DATA_DIR/outbox`. Default notice address in code: `erik@transformby10x.ai`. | Resend account unknown. SMTP host unknown. Mailbox provider for `erik@transformby10x.ai` unknown. | Resend dashboard. SMTP provider. Google Workspace or whichever host receives that address. |
| Calendar | Public Google Calendar appointment URLs are hardcoded. Three different URLs appear across `ProofResult.tsx`, `links.ts`, and root `HANDOFF.md`. See `docs/agent-context/known-issues.md`. | Google account that owns those appointment schedules. Not proven to be the same account as Drive. | The `calendar.app.google` links, and Google Calendar on the owning account. |

## Payments

Stripe, without an SDK. Payment Links and price ids are hardcoded in:

- `src/lib/keystones-server.ts` (Context Keystones intro, list, and legacy links)
- `src/app/api/stripe/webhook/route.ts` (report, toolkit, refresh, audit, plus the Keystones links)
- `src/lib/links.ts` (`REPORT_PAYMENT_LINK`)
- `src/components/ProofResult.tsx` (Remote FACT checkout URL)

The webhook accepts `checkout.session.completed`, `checkout.session.async_payment_succeeded`, and a monthly `invoice.paid` path for the refresh price. Signature secret is `STRIPE_WEBHOOK_SECRET`. Intro-link deactivation uses `STRIPE_LINK_KEY`.

Account: the Stripe account that owns those payment links. The dashboard login is not in the repo. Nothing in this checkout provisions Stripe through Cursor. Cursor agents have edited this integration on other branches. Pull request 10, on `live-backup-20261023` only, also names `STRIPE_CHECKOUT_READ_KEY` and `STRIPE_SECRET_KEY`.

Direct access: Stripe Dashboard, as the account owner. Do not rotate, deactivate, or create links as part of a portability audit.

Root `HANDOFF.md` (2026-10-23) says test promotion codes were still active and `STRIPE_LINK_KEY` was unset. Not rechecked in Stripe.

## Analytics and CI

| Service | Finding |
| --- | --- |
| Product analytics | No Plausible, GA, PostHog, Segment, Mixpanel, Sentry, or Vercel Analytics dependency in this tree. Opt-in diagnostics post to this app and stay in memory. |
| CI | No `.github/workflows` on this branch. Tests run when a person runs `npm test`. |
| Dependabot | A remote branch `dependabot/npm_and_yarn/npm_and_yarn-aafae73067` exists. No dependabot.yml in this checkout. `DECISION_LOG.md` claims secret scanning. Not verified in GitHub settings. |
| Error tracking | `console.error` on the cap helper. No external error service. |

## Third-party APIs the code calls

| API | When |
| --- | --- |
| Stripe webhook signature, local HMAC | Every webhook request |
| `https://api.stripe.com/v1/payment_links/...` | Only when the intro cap trips and `STRIPE_LINK_KEY` is set |
| `https://api.resend.com/emails` | When `RESEND_API_KEY` is set |
| SMTP server from `SMTP_HOST` | When Resend is unset and SMTP vars are set |
| Google fonts | At `next build` / `next dev`, via `next/font/google` |
| `buy.stripe.com` and `calendar.app.google` | Browser links, not server SDK calls |
| `transformby10x.ai` pages such as `/review/friction-model/index.html` and `/offers/k2-tbtx-wordmark-ink.png` | Links and email images. Those files are not in this repo. The offers site is `erikhinla/tbtx-offers-site`. |

## Environment variable and secret names

Stored in the VPS `.env` next to `docker-compose.yml` (gitignored pattern `.env*`), unless noted.

| Name | Where it is read | Storage |
| --- | --- | --- |
| `PROOF_BASE_PATH` | `next.config.mjs`, `Dockerfile`, compose | Build arg. Compose sets `/proof/screen`. |
| `PROOF_BOOKING_URL` | `next.config.mjs`, `Dockerfile`, compose build args | Build arg. Optional shell env when composing. |
| `NEXT_PUBLIC_PROOF_BASE_PATH` | Client components | Injected by Next from `PROOF_BASE_PATH`. |
| `NEXT_PUBLIC_PROOF_BOOKING_URL` | `src/lib/links.ts` | Injected from `PROOF_BOOKING_URL`. |
| `NEXT_PUBLIC_PROOF_NOINDEX` | `src/app/layout.tsx` | Injected for the preview base path. |
| `NODE_ENV` | Next, Keystones sweep | Compose sets `production`. |
| `DATA_DIR` | `src/lib/fulfil.ts`, Keystones | Process env. Default `data/` . Compose volume covers `/app/data` when unset. |
| `PUBLIC_BASE_URL` | Email links | Process env. Code default is the public PROOF URL. |
| `NOTIFY_EMAIL` | Operator mail | Process env. Code default `erik@transformby10x.ai`. |
| `MAIL_FROM` | Resend and SMTP | Process env. |
| `RESEND_API_KEY` | `src/lib/fulfil.ts` | VPS `.env`. Never commit. |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_PORT` | `src/lib/fulfil.ts` | VPS `.env`. Root handoff omitted the first three names. |
| `STRIPE_WEBHOOK_SECRET` | Webhook route | VPS `.env`. |
| `STRIPE_LINK_KEY` | `closeIntroIfCapped` | VPS `.env`. Restricted key, payment links write, per the code comment. |
| `KEYSTONES_GENERATOR`, `KEYSTONES_PYTHON` | Keystones route | Optional overrides. |
| `STRIPE_CHECKOUT_READ_KEY`, `STRIPE_SECRET_KEY` | Not in this checkout | Named in pull request 10 on the other branch. |
| `GCP_PROJECT_ID`, `GCP_REGION`, `GCP_SERVICE_ACCOUNT_EMAIL`, `DEPLOY_TARGET`, `TARGET_DOMAIN`, `TELEMETRY_ENABLED`, `DIAGNOSTIC_MODE`, `VISUALIZER_VARIANT` | Deleted file `.env.record` | Still in git history with non-empty values. Not printed here. Not the live Docker env. |

Also on the VPS, by the briefing, and not in git: Nginx configs, SSH keys, bot tokens, OAuth client secrets, Nous Cloud / Hermes environment and tokens. Names only. Contents unknown to this run.

Committed identifiers that are not API keys, and that are public if the GitHub repo stays public: Stripe payment-link and price ids, Resend template UUIDs in `src/lib/mail-templates.ts`, Vercel org and project ids in `.vercel/project.json`.

## What breaks if Cursor, Grok Bot, or SpaceXAI goes away

The running PROOF container does not call Cursor, Grok, or SpaceXAI. A buyer can finish the 15 answers, and the webhook can run, without those products. Fonts, Stripe, Resend, and the VPS are the runtime dependencies.

These workflows do depend on that tooling or on Hermes, and would stop:

- Cursor cloud agents that commit, open pull requests, or deploy. Pull request 10 was produced that way. The app keeps serving the image already on the VPS.
- Hermes on the VPS, which root `HANDOFF.md` and the removed README describe as the local operator for deploys. Copy-rule files are recorded at `/root/tbtx-next-ecosystem/hermes/`. Unverified on disk. The committed Vercel link was "so Hermes can manage it."
- Nous Cloud and the `tbtx-proof-bot` install. Briefing: separate from this repo, Telegram and Discord in progress. Tokens are not in git. If that host goes away, the bots stop. PROOF's website does not import them.
- Session memory and Box or workspace working copies. Briefing lists them as often outside git. This run did not find a Box client in the repo. Losing an agent transcript loses chat context. It does not delete the git branch.

Google Drive canon stays with the Google account. GitHub stays with `erikhinla`. Netcup stays with the Netcup login. None of those three are Cursor products.

## Sibling repositories

Inventory only. This audit did not push to them. GitHub visibility is from the API on 2026-11-10.

| Repo | Seen this run | Role from the briefing or the repo description |
| --- | --- | --- |
| `erikhinla/flow-visualizer-telemetry` | Yes. Public. This repo. | PROOF app. |
| `erikhinla/tbtx-home-site` | Yes. Private. Updated 2026-11-08. | Briefing: historical home page for transformby10x.ai. |
| `erikhinla/tbtx-offers-site` | Yes. Public. | Briefing: historical offers page. This app's email loads a wordmark from `/offers/` on the public site. |
| `erikhinla/erikhbush.com` | Yes. Public. Description mentions Fog Scan and Digital De-Fog Daily. | Briefing: personal site, adjacent, not the primary TBTX site. |
| `erikhinla/tbtx-brain` | Yes. Private. Updated 2026-11-07. | Briefing: Obsidian vault markdown. Do not overwrite it from a dashboard app. |
| `erikhinla/erikhinla-tbtx-ops-dashboard` | Yes. Private. Description: hub for PROOF diagnostic and tracking. | Sibling. Not imported by this app. |
| `erikhinla/tbtx-next-ecosystem` | Yes. Public. Description: TBTX + BBAI + BBM ecosystem. | Briefing lists it. Root handoff points at a Hermes copy of rules under `/root/tbtx-next-ecosystem/` on the VPS, which may or may not match this GitHub repo. Unverified. |
| `erikhinla/tbtx-bold-ecosystem-build` | Yes. Public. Description: alt version of the 3-brand ecosystem. Updated 2026-07-06. | Sibling, looks idle from the timestamp alone. |
| `erikhinla/tbtx-web` | Yes. Private. Default branch `main`. Updated 2026-03-03. | Briefing lists it. |
| `TransformBy10X/tbtx-web` | Not listed. Org search returned a conditional-access block. | Briefing lists it. Unverified. |
| `erikhinla/tbtx-live-backup-index` | Yes. Private. Updated 2026-10-25. | Briefing: contains `HANDOFF-2026-10-24.md`. That file was not opened. |
| context-keystones | No repo by that name under `erikhinla`. | Briefing: historical name for a Keystones pack generator. The generator in this repo is `keystones/generator/`. This repo also has branch `codex/context-keystones-2026-10-13`. |
| `erikhinla/proof-build-handoff` | Yes. Private. Archived. | Not in the briefing. Older handoff repo. Left untouched. |

## Local branches on the PROOF remote that are easy to confuse

`main`, `proof-orb-approved-screens-20261104`, `live-backup-20261023`, `cursor/back-checkout-value-4b40` (pull request 10 head), `cursor/link-vercel-hermes-edc1`. Feature work for the approved screens belongs on the approved-screens line until the owner says to merge.
