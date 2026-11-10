# Recurring tasks

How this repo says the work is done. VPS steps are the recorded procedure. This audit did not log into the VPS.

## Run the app locally

`npm ci`, then `npm run dev`. `predev` rebuilds `public/proof-scan.mjs` and `public/proof-scan-contract.json`. Set `PROOF_BASE_PATH=/proof/screen` when you need the production subpath. Details are in the root `README.md`.

## Check a change

1. `npm test` (55 tests passed on `ea59d8d` during this audit).
2. `npx tsc --noEmit`.
3. Click through 15 answers to the result at a phone width and a desktop width.
4. If the diff touches `src/lib/scan-contract.ts` or the questionnaire, confirm `prebuild` regenerated the public scan module and that the handoff tests still pass.
5. If the diff touches copy, keep choice ids, pressure ids, Stripe ids, and Resend template ids stable unless the owner asked for a model or billing change.

There is no GitHub Actions workflow in this checkout. Nothing runs those tests on push. A remote branch named `dependabot/npm_and_yarn/npm_and_yarn-aafae73067` exists. No Dependabot config file is in this tree. `DECISION_LOG.md` mentions Dependabot secret scanning. Whether that is enabled on the GitHub account was not checked.

## Generate a Keystones pack

`python3 keystones/generator/generate.py --intake intake.json --out OUTPUT_FOLDER`. Optional `--proof` and `--zip`. Example intake: `keystones/generator/intake-example.json`. The HTTP route shells out to that script (`KEYSTONES_GENERATOR`, `KEYSTONES_PYTHON`). Buyers reach it only after the webhook has written a paid ledger row.

## Email and failed sends

`sendMail` in `src/lib/fulfil.ts` uses Resend when `RESEND_API_KEY` is set, otherwise SMTP when `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS` are set. Any failure, and the case where no sender is configured, writes JSON under `DATA_DIR/outbox`. Someone has to read that outbox on the server. It is not in git.

Resend template ids for the older order mails are in `src/lib/mail-templates.ts`. The three Keystones template ids are empty strings, so those mails send the local HTML fallback.

## Intro price cap

After each paid Keystones entry, `closeIntroIfCapped` counts real purchases in `fulfilment-log.json` (total greater than 0). At 50 it deactivates the intro payment link when `STRIPE_LINK_KEY` is set, and emails `NOTIFY_EMAIL` either way. Root `HANDOFF.md` said on 2026-10-23 that `STRIPE_LINK_KEY` was unset and the fallback was email. Unverified whether that is still true on the VPS.

## Zip cleanup

Keystones download zips older than 24 hours are deleted on keystones requests and once an hour inside the Node process. A restart does not need a cron entry for that sweep. The files live on the `./data` volume.

## Deploy, only after an explicit yes

Root `HANDOFF.md` records: tar the source, tag the current image, test in a throwaway container, then `docker compose build proof-app && docker compose up -d proof-app`. Do not run that because a branch updated or a docs PR merged. The operator briefing says a wrong-screen deploy had already been rolled back to `proof-release:20261105` as of 2026-11-09.

## Backups the root handoff names

On the VPS, `/root/backups/` as a tarball per deploy, plus docker tags `proof-app:pre-*`. Unverified this run. The git branch `live-backup-20261023` is a source snapshot in GitHub, not a substitute for the data volume.

## Copy passes

Recent copy work landed as scoped commits that name the files they touch and say backend ids were unchanged. Follow that shape. Do not restyle the whole app in the same change. Do not rewrite the stale marketing lines called out in `known-issues.md` unless the owner asks. Those lines are not in this checkout.

## What this audit did not find a schedule for

No cron file, no GitHub Action, no queue worker, and no analytics export job are in the repo. Domain renewal, Stripe tax settings, Resend template publishing, and VPS patching are outside this tree.
