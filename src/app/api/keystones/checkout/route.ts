import { offerState } from '../../../../lib/keystones-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Sends the buyer to the checkout for the current price: $49 for the first 50 real purchases, $349 after. Carries the PROOF code through. */
export async function GET(req: Request) {
  const ref = new URL(req.url).searchParams.get('ref') || '';
  const { url } = await offerState();
  const to = /^p1_[acs]_[1-4]{15}$/.test(ref) ? `${url}?client_reference_id=${ref}` : url;
  return new Response(null, { status: 302, headers: { Location: to, 'Cache-Control': 'no-store' } });
}
