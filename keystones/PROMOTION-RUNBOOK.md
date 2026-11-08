# Promotion runbook

No coupon, promotion code, or price was created or changed by this repository change.

## Owner completion, separate from the old $49 group code

The historical $49 group-code idea is not this path. Public prices stay $74 and $347.

When Erik is ready, create the owner discount in the Stripe Dashboard, not in this repo:

1. Coupon: 100% off, duration once, currency USD if Stripe asks, `max_redemptions` 1.
2. Promotion code: one private code on that coupon, `max_redemptions` 1, expires the same day. Do not put it on a public page.
3. Restrict it to the current Context Keystones product `prod_VUt4BnmzMP8cKV` if the Dashboard allows a product limit. Apply it on the current $74 or $347 payment link, which already allows promotion codes.
4. Checkout must show a $0 total and must not ask for a card (`payment_method_collection` is already `if_required`).
5. Stop if the product, the price, or the total is anything else.

The webhook accepts that completion only when all of these are true:

- session `status` is `complete` and `mode` is `payment`
- `payment_status` is `no_payment_required`
- `payment_intent` is null
- currency is `usd`, quantity is 1
- `amount_subtotal` is 7400 or 34700 (or a legacy 4900 or 34900)
- `amount_total` is 0 and `total_details.amount_discount` equals that subtotal
- the price id is the catalog price for that payment link, and the product is `prod_VUt4BnmzMP8cKV` when line items are present

A zero-dollar price, a setup-mode session, an unpaid session, or a mismatched product stays locked. `payment_status: paid` with a matching subtotal still unlocks a normal charge, including a partial discount, because Stripe has marked the funds paid. A `total` of 0 does not count toward the 50 real purchases.

Official references used: [No-cost orders](https://docs.stripe.com/payments/checkout/no-cost-orders) (fulfill `checkout.session.completed`, no PaymentIntent on a free completed session) and the [Checkout Session object](https://docs.stripe.com/api/checkout/sessions/object) (`amount_subtotal` is before discounts, `amount_total` is after, `line_items` are not in the webhook unless expanded). The `no_payment_required` enum text names setup mode and a billing-cycle anchor, so those are rejected here rather than treated as a free order.

## Group code

Do not create a public $49 code. If a group price is wanted later, it needs its own price and its own decision. It is not a reason to weaken this gate.
