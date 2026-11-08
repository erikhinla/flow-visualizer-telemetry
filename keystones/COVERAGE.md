# Coverage matrix

Status words: implemented means the change is in this repository and covered by an automated test on this Linux machine. Production means a live order, a live email provider, or the deployed server. OS means a real Mac or Windows run of a downloaded pack. None of those were done here.

Candidate source at the start of this work: `live-backup-20261023` at `7abb993`. That commit is not the verified deployed revision. See `DEPLOYMENT-CHECKLIST.md`.

The `context-keystones` repository was not readable with this credential (GitHub returned 404). The generator changed here is the copy this app's Docker image runs (`keystones/generator`, copied by the Dockerfile). This is not a second generator.

| Item | In this repo | Tested here | Production / OS / provider |
|---|---|---|---|
| Current $74 and $347 sessions unlock when currency, quantity, product and pre-discount subtotal match | implemented | node tests | live completion not run |
| Legacy $49 and $349 sessions still unlock | implemented | node tests | historical orders not replayed against production |
| 100% discount, no PaymentIntent, `no_payment_required`, discount equals the catalog subtotal | implemented | node tests | no live no-cost order; no coupon created |
| Unpaid, incomplete, wrong link, wrong product, wrong price, quantity other than 1, zero list price | rejected | node tests | not a live attack test |
| Entitlement kept when the intake email fails; redelivery sends once | implemented | node test with a fake sender | Resend and SMTP not called |
| Same intake returns the same download; a failed delivery email does not spend another build | implemented | node test, generator ran | live download not opened |
| Public checkout offers the current $74 link, then $347. No spots-left sentence | implemented | node test of offer state | live site already offered $74 on 2026-11-08; this source did not, until this change |
| PROOF answer carryover into AI-CONTEXT | preserved | python test with q3 | actual 15 live answers unknown |
| Radio, print, and experiential specification, rights, review, and release files | implemented | python test | not used on a real job |
| Paste-ready text and Markdown export; stable revision; does not send or mark announced | implemented | python test | not pasted into a real channel |
| Implementation plan and walkthrough scaffold from the intake | implemented | python test for TransformBy10X | not a recording of a delivered pack |
| Visible schema error when a column header is renamed | implemented | python test | not tried on a customer's file |
| Archive conflict, approved-file safeguard, FINAL/date names left in place | implemented | python test | not tried on a real edit |
| Ambiguous rights wording requires a person; native audio not edited | implemented | python test | not a legal review |
| Runtime check states this Linux run is not Mac or Windows acceptance | implemented | python test and menu smoke | Mac and Windows not run |
| Notices off until set up; one designated sender outside the pack; test mode refuses a public mail host | implemented | python test | no real mailbox or chat tool |
| Solo owner is not given an Account Director or Business Affairs title | implemented | python test and intake defaults | browser check is local only |
| Mobile error focus, described-by, and static nav | implemented | code review | local browser check; not a phone |
| $49 group-code promotion | runbook only | not created | no Stripe write |
| Mac .command and Windows .bat on a real computer | runbook and `check_pack.py` | Linux syntax and runtime text only | unverified |
| Deployed webhook source | unknown | public unsigned POST returns bad signature | do not treat this branch as already deployed |

Automated commands: `npm test` (node tests plus `keystones/generator/tests`). They do not complete a Stripe checkout.
