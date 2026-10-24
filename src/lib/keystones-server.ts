import { randomBytes } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { DATA_DIR, ERIK, findEntry, sendMail } from './fulfil';
import { templated } from './mail-templates';

/** Server-only rules for paid Context Keystones builds. */
/** Intro: $49 for the first 50 real purchases. After that the checkout switches to the $349 link on its own. */
export const INTRO_LINK = 'plink_1UTtQmCMxQwcbhDnaucAfhpI';
export const INTRO_URL = 'https://buy.stripe.com/dRm4gy9wb38i41Jd4ec3m05';
export const INTRO_PRICE = 'price_1UTtQbCMxQwcbhDnwRozaDDm';
export const FULL_LINK = 'plink_1UTtbECMxQwcbhDnHyV8ZqQv';
export const FULL_URL = 'https://buy.stripe.com/dRm4gyfUz8sC2XFd4ec3m06';
export const FULL_PRICE = 'price_1UTtb7CMxQwcbhDnQIvS6O51';
export const INTRO_LIMIT = 50;
/** Subtotal in cents (before any code) each link must show in USD. */
export const SUBTOTAL: Record<string, number> = { [INTRO_LINK]: 4900, [FULL_LINK]: 34900 };
export const MAX_BUILDS = 5;
export const ZIP_TTL_MS = 24 * 60 * 60 * 1000;
export const MAX_BODY = 100_000;
const ZIP_DIR = path.join(DATA_DIR, 'keystones');
const BUILDS = path.join(DATA_DIR, 'keystones-builds.json');

export const SESSION_RE = /^cs_(live|test)_[A-Za-z0-9]{10,200}$/;
export const TOKEN_RE = /^[A-Za-z0-9_-]{32}$/;

/** Paid session check. The entry is only written by the signed Stripe webhook after it saw payment_status paid, this payment link and the list price. */
export async function paidSession(sessionId: string): Promise<{ email: string | null; code: string | null } | null> {
  if (!SESSION_RE.test(sessionId)) return null;
  const entry = await findEntry(`cs:${sessionId}`);
  if (!entry || entry.kind !== 'keystones' || entry.status !== 'paid') return null;
  const code = /(?:^|\| )code=(p1_[acs]_[1-4]+)/.exec(entry.detail ?? '')?.[1] ?? null;
  return { email: entry.email, code };
}

// ---- build counter (one small JSON file, writes serialized) ----
let chain: Promise<unknown> = Promise.resolve();
async function readBuilds(): Promise<Record<string, number>> {
  try { return JSON.parse(await fs.readFile(BUILDS, 'utf8')) as Record<string, number>; } catch { return {}; }
}
export async function buildsUsed(sessionId: string): Promise<number> {
  return (await readBuilds())[sessionId] ?? 0;
}
/** Reserve one build. Returns the build number (1-based) or null when all are used. */
export function reserveBuild(sessionId: string): Promise<number | null> {
  const run = chain.then(async () => {
    const b = await readBuilds();
    const used = b[sessionId] ?? 0;
    if (used >= MAX_BUILDS) return null;
    b[sessionId] = used + 1;
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = `${BUILDS}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(b));
    await fs.rename(tmp, BUILDS);
    return used + 1;
  });
  chain = run.catch(() => undefined);
  return run;
}
/** Give a build back when the generator failed, so a server error doesn't cost the buyer a build. */
export function releaseBuild(sessionId: string): Promise<void> {
  const run = chain.then(async () => {
    const b = await readBuilds();
    if (b[sessionId]) b[sessionId] -= 1;
    const tmp = `${BUILDS}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(b));
    await fs.rename(tmp, BUILDS);
  });
  chain = run.catch(() => undefined);
  return run;
}

// ---- per-IP rate limit (in memory, per container) ----
const hits = new Map<string, number[]>();
export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return fwd || req.headers.get('x-real-ip') || 'unknown';
}
export function rateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  return list.length > limit;
}

// ---- input cleaning ----
const RESERVED = /^(con|prn|aux|nul|com[0-9¹²³]|lpt[0-9¹²³])$/i;
/** One short answer, safe to become part of a file or folder name on Windows, Mac or Linux. */
export function safeText(v: unknown, max = 120): string {
  if (typeof v !== 'string') return '';
  let s = v.normalize('NFC').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/[\\/:*?"<>|]/g, ' ');
  s = s.replace(/\.{2,}/g, '.').replace(/\s+/g, ' ').trim().replace(/^[.\s]+|[.\s]+$/g, '');
  if (RESERVED.test(s.split('.')[0].trim())) s = '';
  return s.slice(0, max).trim();
}
/** Longer free text (mandatory wording, legal lines): control characters out, length capped. Never used as a path. */
export function safeLong(v: unknown, max = 1000): string {
  if (typeof v !== 'string') return '';
  return v.normalize('NFC').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, ' ').trim().slice(0, max);
}
export function safeList(v: unknown, maxItems = 30, max = 120): string[] | undefined {
  if (v === undefined) return undefined;
  if (!Array.isArray(v)) return [];
  return Array.from(new Set(v.map((x) => safeText(x, max)).filter(Boolean))).slice(0, maxItems);
}

// ---- stored zips ----
export async function storeZip(file: string, name: string, sessionId: string): Promise<string> {
  await fs.mkdir(ZIP_DIR, { recursive: true });
  const token = randomBytes(24).toString('base64url');
  await fs.copyFile(file, path.join(ZIP_DIR, `${token}.zip`));
  await fs.writeFile(path.join(ZIP_DIR, `${token}.json`), JSON.stringify({ name, session: sessionId, at: Date.now() }));
  return token;
}
export async function readZip(token: string): Promise<{ name: string; data: Buffer } | null> {
  if (!TOKEN_RE.test(token)) return null;
  try {
    const meta = JSON.parse(await fs.readFile(path.join(ZIP_DIR, `${token}.json`), 'utf8')) as { name: string; at: number };
    if (Date.now() - meta.at > ZIP_TTL_MS) return null;
    return { name: meta.name, data: await fs.readFile(path.join(ZIP_DIR, `${token}.zip`)) };
  } catch { return null; }
}
/** Delete zips older than 24 hours. Runs on every keystones request and once an hour. */
export async function sweepZips(now = Date.now()): Promise<number> {
  let removed = 0;
  let names: string[] = [];
  try { names = await fs.readdir(ZIP_DIR); } catch { return 0; }
  for (const n of names) {
    const p = path.join(ZIP_DIR, n);
    try {
      const st = await fs.stat(p);
      if (now - st.mtimeMs > ZIP_TTL_MS) { await fs.rm(p, { force: true }); removed += 1; }
    } catch { /* already gone */ }
  }
  return removed;
}
const g = globalThis as { __ksSweep?: NodeJS.Timeout };
if (!g.__ksSweep && process.env.NODE_ENV !== 'test') {
  g.__ksSweep = setInterval(() => { void sweepZips(); }, 60 * 60 * 1000);
  g.__ksSweep.unref?.();
}

// ---- intro counter, from the signed webhook ledger ----
/** Real paid Keystones purchases: unlocked and with money collected (a 100%-off test order has total=0 and doesn't count). */
export async function purchasesSold(): Promise<number> {
  let log: Array<{ kind?: string; status?: string; detail?: string }> = [];
  try { log = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'fulfilment-log.json'), 'utf8')); } catch { return 0; }
  return log.filter((e) => e.kind === 'keystones' && e.status === 'paid' && Number(/total=(\d+)/.exec(e.detail ?? '')?.[1] ?? 0) > 0).length;
}
export async function offerState() {
  const sold = await purchasesSold();
  const intro = sold < INTRO_LIMIT;
  return { intro, sold, left: Math.max(0, INTRO_LIMIT - sold), limit: INTRO_LIMIT, price: intro ? 49 : 349, listPrice: 349, url: intro ? INTRO_URL : FULL_URL };
}

// ---- close the $49 link when the cap is hit ----
const CAP_MARK = () => path.join(DATA_DIR, 'keystones-intro-closed.json');
type Fetch = (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<{ ok: boolean; status: number }>;
/**
 * Called after each paid Keystones entry. At 50 real purchases it deactivates the $49 payment link through the
 * Stripe API (STRIPE_LINK_KEY: a restricted key with Payment Links write only) and tells Erik once.
 * Without a key, or if Stripe fails, Erik gets the notice to switch it off by hand; it retries on the next sale.
 */
export async function closeIntroIfCapped(fetchImpl: Fetch = fetch as unknown as Fetch): Promise<string> {
  const sold = await purchasesSold();
  if (sold < INTRO_LIMIT) return 'open';
  try { const m = JSON.parse(await fs.readFile(CAP_MARK(), 'utf8')); if (m.closed) return 'already-closed'; } catch { /* not closed yet */ }
  const key = process.env.STRIPE_LINK_KEY || '';
  let result = 'no key on the server: deactivate the $49 link by hand';
  let closed = false;
  if (key) {
    try {
      const r = await fetchImpl(`https://api.stripe.com/v1/payment_links/${INTRO_LINK}`, {
        method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded', 'Idempotency-Key': `ks-intro-close-${INTRO_LINK}` }, body: 'active=false' });
      closed = r.ok;
      result = r.ok ? 'deactivated automatically' : `Stripe answered ${r.status}: deactivate the $49 link by hand`;
    } catch (e) { result = `Stripe call failed (${e instanceof Error ? e.message : 'error'}): deactivate the $49 link by hand`; }
  }
  let prev: { notified?: string } = {};
  try { prev = JSON.parse(await fs.readFile(CAP_MARK(), 'utf8')); } catch { /* none */ }
  if (prev.notified !== result) {
    const t = templated('keystones_cap_erik', { SOLD: String(sold), RESULT: result });
    await sendMail({ to: ERIK, subject: t.subject, html: t.html, text: t.text, template: t.template, idempotencyKey: `ks-cap:${closed ? 'closed' : 'manual'}` });
  }
  await fs.writeFile(CAP_MARK(), JSON.stringify({ closed, notified: result, sold, at: new Date().toISOString() }));
  return closed ? 'closed' : 'manual';
}
