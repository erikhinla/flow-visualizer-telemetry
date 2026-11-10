# Portability audit

Date: 2026-11-10. Repository: `erikhinla/flow-visualizer-telemetry`. Starting point verified: branch `proof-orb-approved-screens-20261104` at `ea59d8d1350cc1180392ddf028db6abef40232f7`. `main` was `f15ad43` and was not modified. No deploy, DNS, Stripe, or hosting change was made. No SSH.

The operator briefing is the source for VPS facts this run could not see. Those facts are marked unverified. Secret values were not printed. A pattern scan of the worktree and of `git log -G` found no live Stripe secret key, live restricted key, Resend key, GitHub token, or private-key block.

## 1. What this git repo actually holds

Remote: `https://github.com/erikhinla/flow-visualizer-telemetry`. GitHub listed it public on this date. `setup.record.md` (2026-09-09) still says the repo was created private.

Tracked tree (133 files at the start of the audit, plus these docs):

- Application source `src/`, tests `tests/`, brand assets `public/brand/`, scan export `public/proof-scan.mjs` and `public/proof-scan-contract.json`
- Python generator `keystones/generator/`
- `Dockerfile`, `docker-compose.yml`, `docker-compose.preview.yml`, `package.json`, `package-lock.json`, `next.config.mjs`, `tsconfig.json`
- Notes already in git: root `HANDOFF.md`, `DECISION_LOG.md`, `setup.record.md`
- `.vercel/project.json` (Vercel org id and project id)
- `Dockerfile.bak-prerunnerarg-20261020-2342` (old Dockerfile, not the build)

`README.md` had been deleted in `0f4ab64` and the last version ended mid-install. This audit restores a runbook in `README.md`.

### Present in the briefing or the repo, absent from git

| Item | Evidence | This run |
| --- | --- | --- |
| VPS `.env` | `docker-compose.yml` `env_file`, `.gitignore` `.env*` | Not in the checkout. Correct. |
| `DATA_DIR` ledger, zips, outbox, intro-cap mark, build counts | `src/lib/fulfil.ts`, `src/lib/keystones-server.ts` | Not in git. `.dockerignore` excludes `data`. |
| `context-gap-toolkit.zip` | `src/app/api/toolkit/route.ts` | Not in git. Fresh checkout cannot serve that download. |
| Nginx site, TLS, Docker image tags, release pin `proof-release:20261105` | Operator briefing and root handoff | Unverified. Not in git. |
| Preview trees `/srv/www/tbtx-preview/` and host `proof-orb-preview` containers | Briefing. Compose file for the preview service is in git. | Host state unverified. |
| Copy rules `/root/tbtx-next-ecosystem/hermes/*.md` | Root `HANDOFF.md` | Unverified on the VPS. |
| Operating Guide | Briefing. Drive API found **TBTX Master Operating Book** | Not in git, on purpose. |
| Nous / Hermes / bot tokens, SSH keys, OAuth secrets | Briefing | Not in git. Contents unknown. |
| Box, workspace copies, agent session memory | Briefing | No Box client in this repo. |
| GitHub Actions | No `.github/` in this checkout | CI is not portable because it is not defined. |
| Python unit tests mentioned on pull request 10 | Not in this tree | Generator behavior is not covered here except through the Node tests that mock around it. |

`.env.record` was removed from the tree and remains in history. See risks.

## 2. Safely portable

A new developer, or another agent, can do all of this from git plus Node 18+ and npm:

- Read the product structure, routes, scoring model id, and offer ladder.
- `npm ci`, `npm test` (55 passed on this commit during the audit), `npx tsc --noEmit`, `npm run dev`, `npm run build`.
- Build a local Docker image from `Dockerfile`.
- Regenerate the browser scan module (`npm run export:scan`).
- Run the Keystones generator with Python 3 and the example intake, offline, standard library only.
- See standing rules, decisions, sibling repos, and secret names in `docs/`.
- See buyer-facing canon by opening the Google Doc, with a Google account that already has access. This session could, as `erik@transformby10x.ai`.

The running site does not call Cursor, Grok, or SpaceXAI. Losing those tools does not, by itself, take the current VPS container down.

## 3. Still locked in, or at risk

Severity is about the ability to rebuild and operate PROOF if the current laptop, the VPS, or the agent tools disappeared. It is not a vulnerability write-up.

### High

1. **Production is not this branch, and the pin is not in git.** Briefing: live image `proof-release:20261105`, approved screens not deployed, pull request 10 not on those screens. Compose does not record that image tag. A restore that builds `docker-compose.yml` from `main`, or from this branch, can ship a different screen or a different webhook than the one that is live. Unverified against the host.
2. **The data volume is the order book.** Fulfilment ledger, intro count, and zips are only on the VPS disk unless someone has copied them. Git and GitHub do not have them. The briefing's `/root/backups/` path was not checked.
3. **Secrets and host config live only on the VPS.** `.env`, Nginx, TLS, and SSH are required to boot a second machine. This repo can name the variables. It cannot recreate the values. Stripe, Resend, and DNS logins are not documented to a second owner.
4. **The GitHub repo is public and contains the Stripe catalog ids, Resend template ids, and a Vercel project id.** No live API key was found. Anyone can read the payment-link ids and the template UUIDs. `setup.record.md` still describes the repo as private, so the visibility may surprise the owner.

### Medium

5. **Webhook behaviour splits across branches.** This commit entitles Keystones from the signed event. Pull request 10, merged only to `live-backup-20261023`, re-fetches the Checkout Session first. The next deploy has to choose one. Choosing by merging blindly will mix approved screens with a different payment gate, or drop the approved screens.
6. **`.env.record` remains in git history** with non-empty `GCP_PROJECT_ID`, `GCP_REGION`, `GCP_SERVICE_ACCOUNT_EMAIL`, and related keys. Values were not printed. History was not rewritten.
7. **Booking URL is three different links** across `ProofResult.tsx`, `links.ts`, and root `HANDOFF.md`. The live value is whatever was baked into the image. Unverified.
8. **Privacy statement is a one-paragraph sheet inside PROOF**, not a page in the nav of this app, and the briefing says the public site nav had none. Terms of use are absent from this repo. Keystones "Offer terms" are a buyer-filled field.
9. **`npm ci` reports 3 vulnerabilities (2 high, 1 critical)** in the locked Next 14.2.35 and nodemailer range. The audit tool said the fix is a major upgrade. Not done here.
10. **No CI.** A red test stays red only on the machine that ran it.
11. **Toolkit zip and email wordmark are outside this repo.** Toolkit download 503s without the zip. Email HTML points at `https://transformby10x.ai/offers/k2-tbtx-wordmark-ink.png`, which belongs to the offers site.
12. **Copy canon is a Google Doc plus unverified VPS markdown.** An agent that follows only this repo can drift from the Operating Guide. Root `HANDOFF.md` is already stale on several open items (no `/about` route here, "longer story" string gone, booking URL disagrees).

### Lower

13. **GCP `setup.record.md` describes a platform that Decision #003 says was never provisioned.** Easy to "finish" the wrong deploy.
14. **Vercel project json is committed** while the live host is Netcup. Easy to deploy to the wrong place. Briefing: do not.
15. **Stale lines "01 / The spine" and "See BizBot Mrktng"** are not in this checkout. The briefing says they are still in circulation. Likely a sibling site. Left unchanged.
16. **Repository description still says "Fog"**, which the copy rules ban in buyer-facing language. Internal code still uses a `fog` band id on purpose.
17. **`Dockerfile.bak-*` and the deleted README's "Vitest" and "standalone output" claims** will mislead a cold reader who finds them in history. Current `Dockerfile` runs `next start` and copies `node_modules`. There is no Vitest config.
18. **Hermes, Nous, and Cursor agents are how deploys and some pull requests have been done.** The site survives without them. The next deploy and the bot work do not, until a person has the VPS and the dashboards directly.
19. **`TransformBy10X/tbtx-web` could not be listed** (organization conditional access). A second copy of the web repo may exist and was not audited.
20. **Dependabot branch exists, config file does not.** Secret scanning is claimed in `DECISION_LOG.md` and was not confirmed in GitHub settings.

## 4. Questions for the owner

These were not guessed.

1. Is GitHub visibility supposed to be public? `setup.record.md` says private. The API says public. If it should be private, the committed Stripe and Resend identifiers have already been readable.
2. Which registrar and which DNS host serve `transformby10x.ai` and `erikhbush.com`, and who can log in?
3. Who can log into Netcup, and is the SSH key only on one Mac? Is there a second person or a break-glass path?
4. Is the live container still `proof-release:20261105` from the 2026-11-09 restore? Where is that image built from, if not `docker-compose.yml`?
5. Is `/root/backups/` current, and is `DATA_DIR` copied off the VPS? How often?
6. Is `STRIPE_LINK_KEY` set on the server now? Root handoff said it was not, on 2026-10-23.
7. Which booking URL is canonical: `Xu3RZNM4nEuATHee7`, `GUyyj5aXpiarDWpg6`, or `4mgKAmouyucz7jk79`?
8. Should the next approved deploy include pull request 10's webhook retrieve, the `ea59d8d` screens, or both, and in which order?
9. Where is the Stripe account owned (which email), and where is Resend owned? Are the 2026-10-23 test promotion codes still active? Were the Resend templates published after the empty Keystones template ids?
10. What should a privacy statement and a terms page say, and should they live on the marketing site, inside PROOF, or both? This repo only has the short sheet.
11. Where do "The spine" and "See BizBot Mrktng" still render: home site, offers site, or a cached page?
12. Are the GCP project ids in `setup.record.md` and in historical `.env.record` still live projects? Should history be rewritten later, in a separate approved change? This audit did not rewrite it.
13. Is the Vercel project in `.vercel/project.json` still used for anything?
14. Does `TransformBy10X/tbtx-web` still exist, and does a separate `context-keystones` repo exist under another account? This search did not find the latter under `erikhinla`.
15. Who receives `erik@transformby10x.ai`, and is that mailbox the same Google account that owns the Operating Guide?
16. May a later change correct root `HANDOFF.md` (booking URL, env var list, closed open-items), or should that file stay as the 2026-10-23 snapshot?

## 5. What this audit changed

Docs only, on branch `portability-audit`, cut from `ea59d8d`:

- `README.md`
- `docs/agent-context/`
- `docs/INFRA.md`
- `docs/HANDOFF.md`
- `docs/PORTABILITY-AUDIT.md`

No application code, no `.env`, no lockfile refresh, no image build pushed, no merge.
