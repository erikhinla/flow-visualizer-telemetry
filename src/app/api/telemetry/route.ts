import { NextResponse } from 'next/server';

const held: unknown[] = [];
const LIMIT = 200;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { events?: unknown } | null;
  if (!body || !Array.isArray(body.events)) {
    return NextResponse.json({ error: 'Expected an events array.' }, { status: 400 });
  }

  const batch = body.events.slice(0, 40);
  held.push(...batch);
  if (held.length > LIMIT) held.splice(0, held.length - LIMIT);

  return NextResponse.json({ accepted: batch.length, held: held.length });
}
