# Review findings, 2026-11-08

This is not a rollout and not a recording. `WALKTHROUGH.md` inside `transformby10x-scaffold` is a script for a later recording of a delivered pack. It is not that recording.

Branch: `cursor/back-checkout-value-4b40`. No merge, no deploy, no coupon, no live checkout, no provider send.

## What the review found, and what changed

The first fulfillment gate unlocked a signed event from the payment link and the pre-discount subtotal when line items were absent. Stripe's webhook snapshot does not include line items. A missing read key, or line items pasted into the event, was enough.

The gate now unlocks only from an authenticated Checkout Session retrieve (`STRIPE_CHECKOUT_READ_KEY` or `STRIPE_SECRET_KEY`, expanded `line_items.data.price.product`). The retrieve must have the same session id as the event. One line is required. The price id, product `prod_VUt4BnmzMP8cKV`, USD, quantity 1, `unit_amount`, and line subtotal must match the catalog. If the key is missing, the retrieve does not match, or line items are absent, the handler returns 500 and writes no entitlement.

`payment_status: paid` with a zero total no longer unlocks. A 100% discount unlocks only when the retrieved session is complete, mode `payment`, `payment_status` `no_payment_required`, `payment_intent` null, `amount_total` 0, tax 0, and `amount_discount` equals the catalog subtotal.

A replay of a paid row does not write a second entitlement. A failed intake email is retried from its own ledger row. The same intake returns the stored zip. A crash that leaves a `building` row is given back after two minutes. Build counts and the ledger use a file lock (`data.lock`) so two processes do not both rename the JSON. The concurrent test is eight reservations in one process. Two containers were not started.

Checkout PROOF answers win over a partial browser post. Blank owner fields are no longer filled with Account or Business Affairs on the way to the generator.

A renamed mandatory column makes sync exit with `SCHEMA` instead of saying everything is current. An approved filename stops the whole version group. The paste export includes rights-check flags. The designated sender file is created on a real send, not a preview. Test mode matches the host exactly, so `localhost.example.com` is not local.

## Exact tests that passed after those fixes

Command: `npx tsc --noEmit` then `npm test`.

Node (`tsx --test tests/*.test.ts`): 61 tests, 0 failures. The ones that hold the gate:

- `tests/keystones-catalog.test.ts`: catalog prices, 100% discount, legacy price, rejections, absent lines, a string price, a paid zero total
- `tests/keystones.test.ts`: signed paid checkout, forged retrieve with no lines returns 500 and does not entitle, concurrent reservations stop at 5, intro count ignores the zero-discount order, current $74 and no-cost $347, failed intake email then one retry, same download after a failed delivery email, PROOF code wins over a conflicting browser answer

Python (`python3 -m unittest discover -s keystones/generator/tests`): 6 tests, OK. They cover the solo TransformBy10X plan, radio/print/experiential worksheets, stable export that does not announce, renamed change-log and mandatory columns, archive conflict and approved-file hold, ambiguous rights plus an untouched `.wav`, runtime text, one sender, and `check_pack.py`.

## Deployed revision: what is public, and what the maintainer must check

Read-only GETs on 2026-11-08. No POST.

- `https://transformby10x.ai/proof/screen/keystones` HTTP 200, `server: nginx`, `x-nextjs-cache: HIT`, `etag: "t110sfecaa8dd"`, `cache-control: s-maxage=31536000`.
- The HTML does not contain a git SHA, a deployment id, or `__NEXT_DATA__`.
- The page script is `/_next/static/chunks/app/keystones/page-e572d76755597d47.js`.
- `GET /proof/screen/api/keystones/offer` is `cache-control: no-store` and, from the earlier read in this work, returned `{"intro":true,"left":50,"limit":50,"price":74,"listPrice":347}`.
- Checkout GET redirected to `https://buy.stripe.com/cNi3cu37N7oy2XFggqc3m09`.

That is not a mapping to this branch or to a generator image. This repository's Dockerfile copies `keystones/` into the image and does not record a git SHA. `HANDOFF.md` says the app runs at `/root/flow-visualizer-telemetry` in container `proof-app`. None of that was readable from here.

The maintainer has to record, on the server, before any copy:

1. `git rev-parse HEAD` and `git status -sb` in `/root/flow-visualizer-telemetry`.
2. The running image id (`docker inspect proof-app` or the compose image) and whether its `keystones/generator` matches this branch.
3. Whether `STRIPE_CHECKOUT_READ_KEY` or `STRIPE_SECRET_KEY` is present. The value stays off the record. If neither is set, this webhook returns 500 for every Keystones event and entitles no one.
4. `python3` inside the container and `KEYSTONES_GENERATOR`.

Do not roll out until Erik approves. The safe path is in `keystones/DEPLOYMENT-CHECKLIST.md`. It still means a backup, a throwaway `npm test`, and a stopped smoke, not a public announcement.

## Delivered value that is still not a real run

- No live $0 owner checkout and no coupon. The runbook says how Erik creates a single-use code in the Dashboard.
- No Mac `.command` launch and no Windows `.bat` launch. Linux text says so.
- No recording. The scaffold is the files in this folder.
- No real mail server or chat webhook. Tests refuse a non-local host.
- Radio, print, and experiential worksheets are generated with unresolved specifications. They have not been used on a job.
- The 15 live PROOF answers for Erik are not in this pack. One sample answer, q3, is carried so the mechanism can be seen. The other 14 are unknown.
- `context-keystones` still returned 404. This pack is from `flow-visualizer-telemetry/keystones/generator`.
- After 50 counted sales the app offers $347. `closeIntroIfCapped` still deactivates only the legacy $49 link. The current $74 link can still be paid if someone has the URL. That is the deferred Stripe cap, not an accident, and it is still a way to buy at $74.
- The in-memory rate limit does not survive a second process. The file lock does not cover a retrieve that is slow while two events are both waiting; the ledger write is inside the lock.
