# Deployment checklist

Do not deploy from this change until the checks below are done by a person with production access. This work did not deploy, merge, or change Stripe.

## What was observed on 2026-11-08, read only

- `GET https://transformby10x.ai/proof/screen/api/keystones/offer` returned `{"intro":true,"left":50,"limit":50,"price":74,"listPrice":347}`.
- `GET https://transformby10x.ai/proof/screen/api/keystones/checkout` redirected to `https://buy.stripe.com/cNi3cu37N7oy2XFggqc3m09` (the current $74 link).
- The public keystones page script contained `$74` and `$347` and did not contain `$49` or `$349`.
- `POST https://transformby10x.ai/proof/screen/api/stripe/webhook` with an empty unsigned body returned `{"error":"bad signature"}`.
- Candidate git HEAD at the start was `7abb993` on `live-backup-20261023`. That source still gated on the legacy $49 and $349 links. The live offer and checkout redirect are therefore not that commit. The deployed webhook's source was not visible from the public page, so it is unknown whether production would have entitled a current $74 session before this change.

## Before any rollout

1. On the server, record `git rev-parse HEAD` for `/root/flow-visualizer-telemetry` and the image id behind `proof-app`. If it is not this branch, diff `src/lib/keystones-catalog.ts`, `src/app/api/stripe/webhook/route.ts`, and `keystones/generator` against the running tree before copying anything.
2. Confirm the running generator path (`KEYSTONES_GENERATOR`) and `python3` version are the ones just tested. `python3 scripts/check_runtime.py` must pass. That still is not a Mac or Windows test.
3. Back up source and tag the current image, as `HANDOFF.md` describes. Run `npm test` in a throwaway tree. Do not point tests at live Stripe or a live mail provider.
4. Confirm Stripe, without changing it: product `prod_VUt4BnmzMP8cKV`, prices `price_1UWneDCMxQwcbhDno0WDq2OP` ($74) and `price_1UWneGCMxQwcbhDnCZ2ByTQO` ($347), links `plink_1UWneMCMxQwcbhDnAVR5sHw4` and `plink_1UWnePCMxQwcbhDny8Kk00jy`, both still allowing promotion codes. Leave the product default $49 price and the legacy links as they are.
5. Webhook endpoint remains `https://transformby10x.ai/proof/screen/api/stripe/webhook` for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, and `invoice.paid`.
6. Optional read key: `STRIPE_CHECKOUT_READ_KEY` or `STRIPE_SECRET_KEY` lets the webhook retrieve line items. Without it, a known link and the pre-discount subtotal still gate the order, and the ledger says `lines=link-mapped`. Do not put the key in git.
7. A private 100% code, if Erik creates one in the Dashboard, must be single-use and limited to the owner. This repository does not create it. After a real $0 completion, confirm the ledger row is `status=paid`, `complimentary=yes`, `total=0`, and that the sale count did not increase.
8. Smoke the intake only after the revision above matches. One build, one download, then stop. Do not announce a public price change. The public prices are already $74 and $347.

## Not done by this change

No container restart, no DNS change, no Stripe write, no email to a customer, no merge.
