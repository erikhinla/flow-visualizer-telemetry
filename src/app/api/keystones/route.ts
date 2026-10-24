import { execFile } from 'node:child_process';
import { mkdtemp, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { firstProjectProblems } from '../../../lib/keystones-dates';
import { cleanIntake, obj, proofAnswers, type Json } from '../../../lib/keystones-intake';
import { ERIK, PUBLIC_BASE, sendMail } from '../../../lib/fulfil';
import { templated } from '../../../lib/mail-templates';
import {
  MAX_BODY, MAX_BUILDS, buildsUsed, clientIp, paidSession, rateLimited, releaseBuild, reserveBuild, storeZip, sweepZips,
} from '../../../lib/keystones-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const run = promisify(execFile);
const GENERATOR = process.env.KEYSTONES_GENERATOR ?? path.join(process.cwd(), 'keystones', 'generator', 'generate.py');
const PYTHON = process.env.KEYSTONES_PYTHON ?? 'python3';

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'agency';
}

/** Status for a checkout session: paid or not, builds left, and the PROOF code carried through checkout. */
export async function GET(req: Request) {
  void sweepZips();
  if (rateLimited(`ks-get:${clientIp(req)}`, 60, 60_000)) return Response.json({ error: 'Too many requests. Wait a minute and try again.' }, { status: 429 });
  const s = new URL(req.url).searchParams.get('session_id') || '';
  const paid = await paidSession(s);
  if (!paid) return Response.json({ paid: false });
  return Response.json({ paid: true, buildsLeft: MAX_BUILDS - (await buildsUsed(s)), code: paid.code });
}

export async function POST(req: Request) {
  void sweepZips();
  if (rateLimited(`ks-post:${clientIp(req)}`, 10, 10 * 60_000)) {
    return Response.json({ error: 'Too many builds from this connection. Wait ten minutes and try again.' }, { status: 429 });
  }
  let body: { session_id?: unknown; intake?: Json; proof?: Json };
  try {
    const text = await req.text();
    if (text.length > MAX_BODY) return Response.json({ error: 'That intake is too large.' }, { status: 413 });
    body = JSON.parse(text);
  } catch {
    return Response.json({ error: "The answers couldn't be read." }, { status: 400 });
  }
  const sessionId = typeof body.session_id === 'string' ? body.session_id : '';
  const paid = await paidSession(sessionId);
  if (!paid) return Response.json({ error: "This checkout isn't confirmed yet. Wait a few seconds and try again, or reply to the receipt email." }, { status: 402 });

  const intake = cleanIntake(obj(body.intake));
  if (typeof intake === 'string') return Response.json({ error: intake }, { status: 400 });
  const dateIssue = Object.values(firstProjectProblems(intake.first_project as Record<string, string> | undefined))[0];
  if (dateIssue) return Response.json({ error: `First project: ${dateIssue}` }, { status: 400 });

  const build = await reserveBuild(sessionId);
  if (build === null) return Response.json({ error: `All ${MAX_BUILDS} builds for this purchase are used. Reply to the delivery email for help.` }, { status: 429 });

  const answers = proofAnswers(obj(body.proof).answers, paid.code);
  const dir = await mkdtemp(path.join(tmpdir(), 'keystones-'));
  try {
    const name = `context-keystones-${slug(String(intake.agency_name))}`;
    const out = path.join(dir, name);
    await writeFile(path.join(dir, 'intake.json'), JSON.stringify(intake));
    await writeFile(path.join(dir, 'proof.json'), JSON.stringify({ agency_name: intake.agency_name, answers }));
    await run(PYTHON, [GENERATOR, '--intake', path.join(dir, 'intake.json'), '--proof', path.join(dir, 'proof.json'), '--out', out, '--zip'], { timeout: 60_000, maxBuffer: 4 * 1024 * 1024 });
    const zipFile = `${out}.zip`;
    const size = (await stat(zipFile)).size;
    const token = await storeZip(zipFile, `${name}.zip`, sessionId);
    const url = `${PUBLIC_BASE}/api/keystones/download?t=${token}`;
    let emailed = false;
    if (paid.email) {
      const t = templated('keystones', {
        AGENCY: String(intake.agency_name), DOWNLOAD_URL: url, REBUILD_URL: `${PUBLIC_BASE}/keystones?session_id=${encodeURIComponent(sessionId)}`,
      });
      const r = await sendMail({ to: paid.email, subject: t.subject, html: t.html, text: t.text, template: t.template, replyTo: ERIK, idempotencyKey: `cs:${sessionId}:build${build}:keystones` });
      emailed = r.ok && !r.via.includes('outbox');
    }
    return Response.json({ url, name: `${name}.zip`, size, buildsLeft: MAX_BUILDS - build, emailed }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('[keystones] build failed', err instanceof Error ? err.message : err);
    await releaseBuild(sessionId);
    return Response.json({ error: "The pack couldn't be built. Nothing was used up. Try again, or reply to the receipt email." }, { status: 500 });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
