import { clientIp, rateLimited, readZip, sweepZips } from '../../../../lib/keystones-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** One built pack, by its random token, for 24 hours after the build. */
export async function GET(req: Request) {
  void sweepZips();
  if (rateLimited(`ks-dl:${clientIp(req)}`, 30, 60_000)) return new Response('Too many requests. Wait a minute and try again.', { status: 429 });
  const zip = await readZip(new URL(req.url).searchParams.get('t') || '');
  if (!zip) return new Response('This download link has expired. Open the rebuild link in the delivery email to build the pack again.', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  return new Response(new Uint8Array(zip.data), {
    headers: { 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="${zip.name}"`, 'Cache-Control': 'private, no-store' },
  });
}
