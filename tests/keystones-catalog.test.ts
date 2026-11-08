import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CURRENT_FULL, CURRENT_INTRO, KEYSTONES_PRODUCT, LEGACY_INTRO, assessKeystonesSession } from '../src/lib/keystones-catalog';

const line = (offer: { price: string; unitAmount: number }, extra: Record<string, unknown> = {}) => ({
  quantity: 1,
  amount_subtotal: offer.unitAmount,
  currency: 'usd',
  price: { id: offer.price, product: KEYSTONES_PRODUCT, currency: 'usd', unit_amount: offer.unitAmount },
  ...extra,
});

const paid = (offer: typeof CURRENT_INTRO, extra: Record<string, unknown> = {}) => ({
  status: 'complete',
  mode: 'payment',
  payment_status: 'paid',
  payment_link: offer.link,
  currency: 'usd',
  amount_subtotal: offer.unitAmount,
  amount_total: offer.unitAmount,
  payment_intent: 'pi_test_paid',
  line_items: { data: [line(offer)] },
  ...extra,
});

test('current $74 and $347 catalog orders unlock when product, price, USD and quantity match', () => {
  for (const offer of [CURRENT_INTRO, CURRENT_FULL]) {
    const got = assessKeystonesSession(paid(offer));
    assert.equal(got.ok, true);
    if (got.ok) {
      assert.equal(got.offer.id, offer.id);
      assert.equal(got.complimentary, false);
      assert.equal(got.lines, 'verified');
      assert.equal(got.quantity, 1);
    }
  }
});

test('a completed 100% discount with no PaymentIntent unlocks the current price only', () => {
  const got = assessKeystonesSession({
    status: 'complete',
    mode: 'payment',
    payment_status: 'no_payment_required',
    payment_intent: null,
    payment_link: CURRENT_INTRO.link,
    currency: 'usd',
    amount_subtotal: CURRENT_INTRO.unitAmount,
    amount_total: 0,
    total_details: { amount_discount: CURRENT_INTRO.unitAmount, amount_tax: 0 },
    line_items: { data: [line(CURRENT_INTRO)] },
  });
  assert.equal(got.ok, true);
  if (got.ok) assert.equal(got.complimentary, true);
});

test('legacy list-price orders still match, and a zero list price does not', () => {
  const legacy = assessKeystonesSession(paid(LEGACY_INTRO, { payment_intent: 'pi_legacy' }));
  assert.equal(legacy.ok, true);
  const freePrice = assessKeystonesSession({
    status: 'complete',
    mode: 'payment',
    payment_status: 'no_payment_required',
    payment_intent: null,
    payment_link: CURRENT_INTRO.link,
    currency: 'usd',
    amount_subtotal: 0,
    amount_total: 0,
    total_details: { amount_discount: 0, amount_tax: 0 },
    line_items: { data: [line(CURRENT_INTRO, { amount_subtotal: 0, price: { id: CURRENT_INTRO.price, product: KEYSTONES_PRODUCT, currency: 'usd', unit_amount: 0 } })] },
  });
  assert.equal(freePrice.ok, false);
});

test('unpaid, incomplete, unrelated, and tampered sessions stay locked', () => {
  const cases: Array<Record<string, unknown>> = [
    paid(CURRENT_INTRO, { payment_status: 'unpaid', payment_intent: null }),
    paid(CURRENT_INTRO, { status: 'open' }),
    paid(CURRENT_INTRO, { status: 'expired' }),
    paid(CURRENT_INTRO, { payment_link: 'plink_other' }),
    paid(CURRENT_INTRO, { currency: 'eur' }),
    paid(CURRENT_INTRO, { amount_subtotal: 100 }),
    paid(CURRENT_INTRO, { line_items: { data: [line(CURRENT_INTRO, { quantity: 2 }), line(CURRENT_INTRO)] } }),
    paid(CURRENT_INTRO, { line_items: { data: [line(CURRENT_INTRO, { price: { id: 'price_other', product: KEYSTONES_PRODUCT, currency: 'usd', unit_amount: CURRENT_INTRO.unitAmount } })] } }),
    paid(CURRENT_INTRO, { line_items: { data: [line(CURRENT_INTRO, { price: { id: CURRENT_INTRO.price, product: 'prod_other', currency: 'usd', unit_amount: CURRENT_INTRO.unitAmount } })] } }),
    {
      status: 'complete', mode: 'setup', payment_status: 'no_payment_required', payment_intent: null,
      payment_link: CURRENT_INTRO.link, currency: 'usd', amount_subtotal: CURRENT_INTRO.unitAmount, amount_total: 0,
      total_details: { amount_discount: CURRENT_INTRO.unitAmount, amount_tax: 0 },
    },
    {
      status: 'complete', mode: 'payment', payment_status: 'no_payment_required', payment_intent: 'pi_should_not_exist',
      payment_link: CURRENT_INTRO.link, currency: 'usd', amount_subtotal: CURRENT_INTRO.unitAmount, amount_total: 0,
      total_details: { amount_discount: CURRENT_INTRO.unitAmount, amount_tax: 0 },
      line_items: { data: [line(CURRENT_INTRO)] },
    },
    {
      status: 'complete', mode: 'payment', payment_status: 'no_payment_required', payment_intent: null,
      payment_link: CURRENT_INTRO.link, currency: 'usd', amount_subtotal: CURRENT_INTRO.unitAmount, amount_total: 0,
      total_details: { amount_discount: 0, amount_tax: 0 },
      line_items: { data: [line(CURRENT_INTRO)] },
    },
  ];
  for (const c of cases) {
    const got = assessKeystonesSession(c);
    assert.equal(got.ok, false, JSON.stringify({ payment_status: c.payment_status, status: c.status, reason: got.ok ? '' : got.reason }));
  }
});

test('absent line items, a string price, and a paid zero total do not unlock', () => {
  const noLines = paid(CURRENT_INTRO);
  delete (noLines as { line_items?: unknown }).line_items;
  const missing = assessKeystonesSession(noLines);
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.equal(missing.reason, 'lines missing');
  const barePrice = assessKeystonesSession(paid(CURRENT_INTRO, {
    line_items: { data: [{ quantity: 1, amount_subtotal: CURRENT_INTRO.unitAmount, currency: 'usd', price: CURRENT_INTRO.price }] },
  }));
  assert.equal(barePrice.ok, false);
  if (!barePrice.ok) assert.equal(barePrice.reason, 'product');
  const zeroPaid = assessKeystonesSession(paid(CURRENT_INTRO, { amount_total: 0 }));
  assert.equal(zeroPaid.ok, false);
  if (!zeroPaid.ok) assert.equal(zeroPaid.reason, 'total');
});
