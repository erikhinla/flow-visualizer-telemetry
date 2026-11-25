import { NextResponse } from 'next/server';
import { MAX_BODY_BYTES, parseLeadBody, storeLead } from '../../../lib/clicks-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Lead capture for the Context Crash debrief form. Public POST, one row per accepted email. */
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
  const parsed = parseLeadBody(raw);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const stored = await storeLead(parsed.row);
  return NextResponse.json({ accepted: stored ? 1 : 0 }, { status: 202 });
}
