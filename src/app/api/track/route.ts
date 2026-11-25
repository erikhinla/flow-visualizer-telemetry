import { NextResponse } from 'next/server';
import { MAX_BODY_BYTES, parseTrackBody, storeClick } from '../../../lib/clicks-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Click counting for the four results-view buttons. Public POST, nothing sensitive accepted.
 * Lives at /proof/screen/api/track because next.config.mjs applies PROOF_BASE_PATH to API routes.
 */
export async function POST(req: Request) {
  let raw = '';
  try {
    raw = await req.text();
  } catch {
    return NextResponse.json({ error: 'Unreadable body.' }, { status: 400 });
  }
  if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) {
    return NextResponse.json({ error: `Body is larger than ${MAX_BODY_BYTES} bytes.` }, { status: 400 });
  }
  const parsed = parseTrackBody(raw);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  let stored = 0;
  for (const row of parsed.rows) {
    if (await storeClick(row)) stored += 1;
  }
  return NextResponse.json({ accepted: stored }, { status: 202 });
}
