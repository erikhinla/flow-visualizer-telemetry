import { clientIp, offerState, rateLimited } from '../../../../lib/keystones-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Current Keystones price, worked out live from real paid purchases. Read by the PROOF result and the offers page. */
export async function GET(req: Request) {
  if (rateLimited(`ks-offer:${clientIp(req)}`, 120, 60_000)) return Response.json({ error: 'Too many requests.' }, { status: 429 });
  const o = await offerState();
  return Response.json({ intro: o.intro, left: o.left, limit: o.limit, price: o.price, listPrice: o.listPrice }, {
    headers: { 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': 'https://transformby10x.ai' },
  });
}
