import { NextResponse } from 'next/server';
import { validateBatch } from '../../../lib/telemetry';

const held: unknown[] = [];
const LIMIT = 200;

export async function POST(request: Request) {
  const text = await request.text();
  const batch = validateBatch(text);
  if (!batch.ok) {
    return NextResponse.json({ error: batch.error }, { status: 400 });
  }

  held.push(...batch.events);
  if (held.length > LIMIT) held.splice(0, held.length - LIMIT);

  return NextResponse.json({ accepted: batch.events.length });
}
