import { promises as fs } from 'node:fs';
import path from 'node:path';
import { DATA_DIR, findEntry } from '../../../lib/fulfil';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Toolkit download, only for a Stripe session that bought the toolkit. */
export async function GET(req: Request) {
  const s = new URL(req.url).searchParams.get('s') || '';
  if (!/^cs_(live|test)_[A-Za-z0-9]+$/.test(s)) return new Response('Not found', { status: 404 });
  const entry = await findEntry(`cs:${s}`);
  if (!entry || entry.kind !== 'toolkit') return new Response('Not found', { status: 404 });
  try {
    const zip = await fs.readFile(path.join(DATA_DIR, 'context-gap-toolkit.zip'));
    return new Response(zip, { headers: { 'Content-Type': 'application/zip', 'Content-Disposition': 'attachment; filename="context-gap-toolkit.zip"', 'Cache-Control': 'private, no-store' } });
  } catch {
    return new Response('The toolkit file is missing. Email erik@transformby10x.ai.', { status: 503 });
  }
}
