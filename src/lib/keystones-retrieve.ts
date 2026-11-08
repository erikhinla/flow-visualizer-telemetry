/** Authenticated Checkout Session retrieve. Tests replace this. Production calls Stripe. */

type Session = Record<string, unknown>;
type Retriever = (id: string) => Promise<Session>;

let checkoutRetriever: Retriever | null = null;

/** Tests supply the session Stripe would return. Production leaves this unset. */
export function setCheckoutRetriever(fn: Retriever | null) {
  checkoutRetriever = fn;
}

export async function retrieveCheckoutSession(id: string): Promise<Session> {
  if (checkoutRetriever) return checkoutRetriever(id);
  const key = process.env.STRIPE_CHECKOUT_READ_KEY || process.env.STRIPE_SECRET_KEY || '';
  if (!key) return {};
  const url = `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(id)}?expand[]=line_items.data.price.product`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
  if (!res.ok) throw new Error(`stripe session retrieve ${res.status}`);
  return res.json() as Promise<Session>;
}

export function checkoutRetrieveConfigured(): boolean {
  return Boolean(checkoutRetriever || process.env.STRIPE_CHECKOUT_READ_KEY || process.env.STRIPE_SECRET_KEY);
}
