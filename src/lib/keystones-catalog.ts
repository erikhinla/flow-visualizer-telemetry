/**
 * Context Keystones prices the fulfillment gate is allowed to recognize.
 * Public Stripe prices are not changed here. Current links are what checkout offers.
 * Legacy links stay so a genuine earlier order can still unlock.
 * The product default price is still the legacy $49 price and is not a charge amount.
 */

export const KEYSTONES_PRODUCT = 'prod_VUt4BnmzMP8cKV';

export interface CatalogOffer {
  id: 'legacy-intro' | 'legacy-full' | 'current-intro' | 'current-full';
  link: string;
  url: string;
  price: string;
  /** Pre-discount unit amount in USD cents. */
  unitAmount: number;
  /** Offered by the app's checkout route today. */
  current: boolean;
}

export const OFFERS: CatalogOffer[] = [
  {
    id: 'legacy-intro',
    link: 'plink_1UTtQmCMxQwcbhDnaucAfhpI',
    url: 'https://buy.stripe.com/dRm4gy9wb38i41Jd4ec3m05',
    price: 'price_1UTtQbCMxQwcbhDnwRozaDDm',
    unitAmount: 4900,
    current: false,
  },
  {
    id: 'legacy-full',
    link: 'plink_1UTtbECMxQwcbhDnHyV8ZqQv',
    url: 'https://buy.stripe.com/dRm4gyfUz8sC2XFd4ec3m06',
    price: 'price_1UTtb7CMxQwcbhDnQIvS6O51',
    unitAmount: 34900,
    current: false,
  },
  {
    id: 'current-intro',
    link: 'plink_1UWneMCMxQwcbhDnAVR5sHw4',
    url: 'https://buy.stripe.com/cNi3cu37N7oy2XFggqc3m09',
    price: 'price_1UWneDCMxQwcbhDno0WDq2OP',
    unitAmount: 7400,
    current: true,
  },
  {
    id: 'current-full',
    link: 'plink_1UWnePCMxQwcbhDny8Kk00jy',
    url: 'https://buy.stripe.com/5kQ00ifUz7oy0Px6FQc3m0a',
    price: 'price_1UWneGCMxQwcbhDnCZ2ByTQO',
    unitAmount: 34700,
    current: true,
  },
];

export const OFFER_BY_LINK: Record<string, CatalogOffer> = Object.fromEntries(OFFERS.map((o) => [o.link, o]));
export const SUBTOTAL: Record<string, number> = Object.fromEntries(OFFERS.map((o) => [o.link, o.unitAmount]));

export const CURRENT_INTRO = OFFERS.find((o) => o.id === 'current-intro')!;
export const CURRENT_FULL = OFFERS.find((o) => o.id === 'current-full')!;
export const LEGACY_INTRO = OFFERS.find((o) => o.id === 'legacy-intro')!;
export const LEGACY_FULL = OFFERS.find((o) => o.id === 'legacy-full')!;

export interface AssessOk {
  ok: true;
  offer: CatalogOffer;
  quantity: number;
  complimentary: boolean;
  lines: 'verified' | 'link-mapped';
  total: number;
  subtotal: number;
}

export interface AssessNo {
  ok: false;
  reason: string;
}

type Obj = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

function priceId(line: Obj): string {
  const p = line?.price;
  if (typeof p === 'string') return p;
  if (p && typeof p === 'object') return String(p.id ?? '');
  return '';
}

function productId(line: Obj): string {
  const p = line?.price;
  if (!p || typeof p === 'string') return '';
  const prod = p.product;
  if (typeof prod === 'string') return prod;
  if (prod && typeof prod === 'object') return String(prod.id ?? '');
  return '';
}

function lineItems(obj: Obj): Obj[] | null {
  const data = obj?.line_items?.data;
  return Array.isArray(data) ? data : null;
}

/**
 * Decide whether a signed Checkout Session may unlock Context Keystones.
 * A 100% discount is accepted only as a completed payment-mode order for a catalog
 * price whose pre-discount subtotal is fully explained by amount_discount, with no
 * PaymentIntent. Official Checkout docs say a no-cost order is fulfilled from
 * checkout.session.completed and has no PaymentIntent. The payment_status enum text
 * for no_payment_required names setup mode and a billing-cycle anchor, so those are
 * rejected here. A zero list price is not accepted.
 */
export function assessKeystonesSession(obj: Obj, opts: { requireLines?: boolean } = {}): AssessOk | AssessNo {
  if (!obj || typeof obj !== 'object') return { ok: false, reason: 'missing session' };
  if (obj.status != null && obj.status !== 'complete') return { ok: false, reason: 'incomplete' };
  if (obj.mode != null && obj.mode !== 'payment') return { ok: false, reason: 'not a payment' };
  const offer = OFFER_BY_LINK[String(obj.payment_link ?? '')];
  if (!offer) return { ok: false, reason: 'other link' };
  if (String(obj.currency ?? '').toLowerCase() !== 'usd') return { ok: false, reason: 'currency' };

  const lines = lineItems(obj);
  let quantity = 1;
  let linesState: AssessOk['lines'] = 'link-mapped';
  if (lines) {
    if (lines.length !== 1) return { ok: false, reason: 'quantity' };
    const line = lines[0];
    quantity = Number(line.quantity);
    if (quantity !== 1) return { ok: false, reason: 'quantity' };
    if (String(line.currency ?? obj.currency ?? '').toLowerCase() !== 'usd') return { ok: false, reason: 'currency' };
    if (priceId(line) !== offer.price) return { ok: false, reason: 'price' };
    const product = productId(line);
    if (product && product !== KEYSTONES_PRODUCT) return { ok: false, reason: 'product' };
    if (!product && line.price && typeof line.price === 'object') return { ok: false, reason: 'product' };
    const unit = line.price && typeof line.price === 'object' && line.price.unit_amount != null ? Number(line.price.unit_amount) : offer.unitAmount;
    if (unit !== offer.unitAmount) return { ok: false, reason: 'price' };
    if (line.amount_subtotal != null && Number(line.amount_subtotal) !== offer.unitAmount * quantity) return { ok: false, reason: 'subtotal' };
    linesState = 'verified';
  } else if (opts.requireLines) {
    return { ok: false, reason: 'lines missing' };
  }

  const subtotal = Number(obj.amount_subtotal);
  if (subtotal !== offer.unitAmount * quantity) return { ok: false, reason: 'subtotal' };

  const total = Number(obj.amount_total);
  const status = String(obj.payment_status ?? '');
  if (status === 'unpaid') return { ok: false, reason: 'unpaid' };
  if (status === 'paid') {
    if (obj.status == null) {
      // Historical signed events and the existing suite omit status. Production Stripe sends it.
    }
    return { ok: true, offer, quantity, complimentary: total === 0, lines: linesState, total, subtotal };
  }
  if (status === 'no_payment_required') {
    if (obj.status !== 'complete') return { ok: false, reason: 'incomplete' };
    if (obj.mode !== 'payment') return { ok: false, reason: 'not a payment' };
    if (obj.payment_intent) return { ok: false, reason: 'payment intent' };
    if (total !== 0) return { ok: false, reason: 'total' };
    const discount = Number(obj.total_details?.amount_discount);
    const tax = Number(obj.total_details?.amount_tax ?? 0);
    if (discount !== subtotal || tax !== 0) return { ok: false, reason: 'discount' };
    return { ok: true, offer, quantity, complimentary: true, lines: linesState, total, subtotal };
  }
  return { ok: false, reason: 'payment status' };
}
