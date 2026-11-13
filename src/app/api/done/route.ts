export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Count-only signal that a visitor reached a PROOF result.
 * Nothing is read or stored here: no answers, no score, no cookie, no body.
 * The count comes from the web server's access log for this path. The optional
 * `s` value is the campaign tag from the link the visitor arrived on.
 */
export function GET() {
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
}
