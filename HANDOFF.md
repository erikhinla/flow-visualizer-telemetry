# HANDOFF: PROOF app (flow-visualizer-telemetry)
A Next.js 14 app: the PROOF 15-answer screen, the result page with the BACK / Context Keystones offer, Keystones checkout gating (Stripe webhook, intake, pack generation, emails), and reports.

## Where it runs
- VPS path: /root/flow-visualizer-telemetry. Docker compose service `proof-app`, container port 3000, basePath /proof/screen (public: https://transformby10x.ai/proof/screen/).
- Env file per docker-compose.yml `env_file` (not in git). Runtime data in DATA_DIR (not in git).

## Deploy
1. Back up: `tar czf /root/backups/fvt-src-pre-X-$(date +%Y%m%d-%H%M%S).tgz src public/brand` and `docker tag <current image> proof-app:pre-X-<ts>`.
2. Test in a throwaway container: copy the tree to /tmp (without node_modules), then `docker run --rm -v /tmp/t:/a -w /a node:18-alpine sh -c "npm ci && npm test"` (52 tests).
3. `docker compose build proof-app && docker compose up -d proof-app`.

## Env var names (values never in git)
DATA_DIR KEYSTONES_GENERATOR KEYSTONES_PYTHON MAIL_FROM NEXT_PUBLIC_PROOF_BASE_PATH NEXT_PUBLIC_PROOF_BOOKING_URL NEXT_PUBLIC_PROOF_NOINDEX NODE_ENV NOTIFY_EMAIL PUBLIC_BASE_URL RESEND_API_KEY SMTP_PORT STRIPE_LINK_KEY STRIPE_WEBHOOK_SECRET

## Key files
- src/components/ProofFlow.tsx: the 15-answer flow and the progress tracker.
- src/components/ProofResult.tsx: the result page and the BACK block.
- src/lib/keystones-server.ts: prices, cap logic, checkout links.
- src/lib/fulfil.ts and src/lib/report.ts: email templates (logo is an image, never text).
## Infrastructure
- VPS: root@159.195.251.226 (netcup). Reached over SSH with a key from Erik's Mac.
- Backups on the VPS: /root/backups/ (tgz per deploy) plus docker image tags `proof-app:pre-*`.

## Offers and pricing
- Context Keystones: intro $49 for the first 50 buyers, then $349.
  - $349 price price_1UTtb7CMxQwcbhDnQIvS6O51, payment link plink_1UTtbECMxQwcbhDnHyV8ZqQv.
  - Other ids in the code: price_1UThXWCMxQwcbhDnF4MLaeOL, price_1UTtQbCMxQwcbhDnwRozaDDm, plink_1UThXd…, plink_1UThXf…, plink_1UThXh…, plink_1UThXj…, plink_1UTtQm… (see src/lib/keystones-server.ts).
  - At 50 sales, closeIntroIfCapped() deactivates the intro link via STRIPE_LINK_KEY, or emails Erik if that key isn't set.
- Remote mini FACT: $1,750, remote, call first.
- Friction Audit FACT: $4,500 plus travel ($2,250 plus travel up front, $1,125 on arrival, $1,125 on completion).
- Booking link for both calls: https://calendar.app.google/4mgKAmouyucz7jk79

## Open items (2026-10-23)
- Test promo codes KSLIVETEST1023, KSLIVE2 and KSDIAG10 are still active; deactivate them in the Stripe dashboard.
- STRIPE_LINK_KEY isn't set (cap fallback is an email).
- Coupon fAfUeZeF can only be deleted; left as is.
- Resend templates unpublished.
- The long /about page is still reachable via "The longer story".
- The home page "What's after PROOF" list uses small "TBTX" text tags per offer (a brand label, not the logo). Erik to decide.
## Erik's key rules (apply to every page, email and visual)
- Copy: contractions, plain speech. No em dashes, no "free", no "desk", no tool names, no rhetorical questions, no you/your in headings. Say "Digital Friction", never "Fog". No URLs in visuals.
- Logo: always the real file `k2-tbtx-wordmark-white.png` (lowercase MuseoModerno, tight kerning on purpose). Never retype or re-kern it. On light backgrounds use `k2-tbtx-wordmark-ink.png`, which is the same PNG with its pixels filled #1F1F1F.
- Pages: nested, click-driven, no page scroll. Each screen fits 390x844 and 1440x900. One big headline per screen; price and CTA always in the same spot; nothing scrolls inside a box.
- Value before price, always.
- CTA labels match their destinations: Keystones "Start with PROOF", Remote mini FACT "Book a mini FACT call", Friction Audit FACT "Book a FACT call".
- Brand colors are accents only: tbtx #d01e98, bbai #b37157, bbm #69f2c4, ink #1F1F1F, bg #E9E5DE.
- Source: /root/tbtx-next-ecosystem/hermes/COPY-RULES.md, COPY-STYLE-GUIDE.md, DESIGN-GUIDE.md on the VPS.
- Never commit or print secrets.
