import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { mkdtempSync, writeFileSync, utimesSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { before, test } from 'node:test';

const dir = mkdtempSync(path.join(tmpdir(), 'ks-test-'));
process.env.DATA_DIR = dir;
(process.env as Record<string, string>).NODE_ENV = 'test';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_only';

let ks: typeof import('../src/lib/keystones-server');
let intake: typeof import('../src/lib/keystones-intake');
let webhook: (req: Request) => Promise<Response>;
before(async () => {
  ks = await import('../src/lib/keystones-server');
  intake = await import('../src/lib/keystones-intake');
  webhook = (await import('../src/app/api/stripe/webhook/route')).POST;
});

test('names: path traversal and Windows reserved names are stripped', () => {
  assert.equal(ks.safeText('../../etc/passwd'), 'etc passwd');
  assert.equal(ks.safeText('..\\..\\Windows'), 'Windows');
  assert.equal(ks.safeText('CON'), '');
  assert.equal(ks.safeText('nul.txt'), '');
  assert.equal(ks.safeText('Com1'), '');
  assert.equal(ks.safeText('Acme <Studio>: "West"?'), 'Acme Studio West');
  assert.equal(ks.safeText('x'.repeat(500), 80).length, 80);
  assert.equal(ks.safeText('Ñandú Créatif'), 'Ñandú Créatif');
});

test('intake: only known fields, capped sizes, reserved agency name refused', () => {
  const big = { agency_name: 'Acme', departments: Array.from({ length: 50 }, (_, i) => ({ name: `D${i}`, lead: 'L' })), rounds: [{ name: 'R' }], evil: 'x', stages: Array.from({ length: 99 }, (_, i) => `S${i}`) };
  const out = intake.cleanIntake(big) as Record<string, unknown>;
  assert.equal(typeof out, 'object');
  assert.equal((out.departments as unknown[]).length, 20);
  assert.equal((out.stages as unknown[]).length, 20);
  assert.equal(out.evil, undefined);
  assert.equal(typeof intake.cleanIntake({ ...big, agency_name: 'AUX' }), 'string');
  assert.equal(typeof intake.cleanIntake({ ...big, departments: [] }), 'string');
});

test('PROOF answers come from the checkout code when the browser sends none', () => {
  const a = intake.proofAnswers({}, 'p1_a_' + '2'.repeat(15));
  assert.equal(Object.keys(a).length, 15);
  const b = intake.proofAnswers({ q1: 'q1-c1', bad: '../x' }, null);
  assert.deepEqual(b, { q1: 'q1-c1' });
});

test('rate limit trips after the limit', () => {
  for (let i = 0; i < 10; i += 1) assert.equal(ks.rateLimited('t:1', 10, 60_000), false);
  assert.equal(ks.rateLimited('t:1', 10, 60_000), true);
  assert.equal(ks.rateLimited('t:2', 10, 60_000), false);
});

function signed(event: object) {
  const raw = JSON.stringify(event);
  const t = Math.floor(Date.now() / 1000);
  const sig = createHmac('sha256', 'whsec_test_only').update(`${t}.${raw}`).digest('hex');
  return new Request('http://x/api/stripe/webhook', { method: 'POST', body: raw, headers: { 'stripe-signature': `t=${t},v1=${sig}` } });
}
const session = (id: string, extra: object = {}) => ({ id: `evt_${id}`, type: 'checkout.session.completed', data: { object: {
  id, payment_status: 'paid', payment_link: ks.INTRO_LINK, currency: 'usd', amount_subtotal: 4900, amount_total: 0,
  client_reference_id: 'p1_a_' + '1'.repeat(15), customer_details: { email: 'buyer@example.com' }, ...extra } } });

test('only a signed, paid checkout at the list price unlocks builds', async () => {
  const good = 'cs_test_' + 'a'.repeat(20);
  assert.equal(await ks.paidSession(good), null);
  assert.equal((await webhook(new Request('http://x', { method: 'POST', body: JSON.stringify(session(good)), headers: { 'stripe-signature': 't=1,v1=00' } }))).status, 400);
  assert.equal(await ks.paidSession(good), null);
  const first = await webhook(signed(session(good)));
  assert.equal(first.status, 200);
  assert.equal((await first.json()).cap, 'open'); // below the cap nothing is switched off
  const paid = await ks.paidSession(good);
  assert.equal(paid?.email, 'buyer@example.com');
  assert.equal(paid?.code, 'p1_a_' + '1'.repeat(15));
  const cheap = 'cs_test_' + 'b'.repeat(20);
  await webhook(signed(session(cheap, { amount_subtotal: 100 })));
  const wrongLink = 'cs_test_' + 'f'.repeat(20);
  await webhook(signed(session(wrongLink, { payment_link: ks.FULL_LINK, amount_subtotal: 4900 })));
  assert.equal(await ks.paidSession(wrongLink), null);
  assert.equal(await ks.paidSession(cheap), null);
  const unpaid = 'cs_test_' + 'c'.repeat(20);
  await webhook(signed(session(unpaid, { payment_status: 'unpaid' })));
  assert.equal(await ks.paidSession(unpaid), null);
  const other = 'cs_test_' + 'd'.repeat(20);
  await webhook(signed(session(other, { payment_link: 'plink_other' })));
  assert.equal(await ks.paidSession(other), null);
  assert.equal(await ks.paidSession('../../etc'), null);
});

test('five builds per session, and a failed build is given back', async () => {
  const s = 'cs_test_' + 'e'.repeat(20);
  for (let i = 1; i <= 5; i += 1) assert.equal(await ks.reserveBuild(s), i);
  assert.equal(await ks.reserveBuild(s), null);
  await ks.releaseBuild(s);
  assert.equal(await ks.reserveBuild(s), 5);
  assert.equal(await ks.buildsUsed(s), 5);
});

test('stored zips download by token and are removed after 24 hours', async () => {
  const f = path.join(dir, 'a.zip');
  writeFileSync(f, 'PK');
  const token = await ks.storeZip(f, 'context-keystones-acme.zip', 'cs_test_x');
  assert.match(token, ks.TOKEN_RE);
  assert.equal((await ks.readZip(token))?.name, 'context-keystones-acme.zip');
  assert.equal(await ks.readZip('../../keystones-builds'), null);
  const old = (Date.now() - 25 * 3600 * 1000) / 1000;
  for (const ext of ['zip', 'json']) utimesSync(path.join(dir, 'keystones', `${token}.${ext}`), old, old);
  assert.equal(await ks.sweepZips(), 2);
  assert.equal(existsSync(path.join(dir, 'keystones', `${token}.zip`)), false);
});

test('intro: $49 for the first 50 real purchases, test-code orders not counted, then $349', async () => {
  const start = await ks.offerState();
  assert.equal(start.sold, 0); // the earlier test orders all had total 0
  assert.equal(start.url, ks.INTRO_URL);
  for (let i = 0; i < 49; i += 1) await webhook(signed(session(`cs_test_real${String(i).padStart(12, '0')}`, { amount_total: 4900 })));
  let o = await ks.offerState();
  assert.deepEqual([o.intro, o.left, o.price], [true, 1, 49]);
  await webhook(signed(session('cs_test_zero00000000000001', { amount_total: 0 })));
  assert.equal((await ks.offerState()).left, 1);
  await webhook(signed(session('cs_test_real00000000000050', { amount_total: 4900 })));
  o = await ks.offerState();
  assert.deepEqual([o.intro, o.left, o.price, o.url], [false, 0, 349, ks.FULL_URL]);
  await webhook(signed(session('cs_test_full00000000000001', { payment_link: ks.FULL_LINK, amount_subtotal: 34900, amount_total: 34900 })));
  assert.ok(await ks.paidSession('cs_test_full00000000000001'));
});

test('at the 50th real purchase the $49 link is switched off once, and Erik is told', async () => {
  const { readFileSync, readdirSync } = await import('node:fs');
  // The earlier test already passed 50. Reset the marker and run the close with a stub Stripe.
  const calls: Array<{ url: string; body: string; auth: string }> = [];
  const stub = async (url: string, init: { method: string; headers: Record<string, string>; body: string }) => { calls.push({ url, body: init.body, auth: init.headers.Authorization }); return { ok: true, status: 200 }; };
  const { rmSync } = await import('node:fs');
  rmSync(path.join(dir, 'keystones-intro-closed.json'), { force: true });
  delete process.env.STRIPE_LINK_KEY;
  assert.equal(await ks.closeIntroIfCapped(stub), 'manual');
  assert.equal(calls.length, 0);
  process.env.STRIPE_LINK_KEY = 'rk_test_only';
  assert.equal(await ks.closeIntroIfCapped(stub), 'closed');
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, new RegExp(`/v1/payment_links/${ks.INTRO_LINK}$`));
  assert.equal(calls[0].body, 'active=false');
  assert.equal(await ks.closeIntroIfCapped(stub), 'already-closed');
  assert.equal(calls.length, 1);
  const out = readdirSync(path.join(dir, 'outbox')).map((f) => readFileSync(path.join(dir, 'outbox', f), 'utf8')).join('\n');
  assert.match(out, /50 intro sales reached/);
  assert.match(out, /deactivated automatically/);
  delete process.env.STRIPE_LINK_KEY;
});

test('a paid checkout emails the buyer the intake link, once', async () => {
  const { readFileSync, readdirSync } = await import('node:fs');
  const id = 'cs_test_' + 'm'.repeat(20);
  const r = await (await webhook(signed(session(id, { customer_details: { email: 'mailtest@example.com' } })))).json();
  assert.equal(r.mailed, true);
  await webhook(signed(session(id, { customer_details: { email: 'mailtest@example.com' } })));
  const hits = readdirSync(path.join(dir, 'outbox')).map((f) => readFileSync(path.join(dir, 'outbox', f), 'utf8')).filter((t) => t.includes('mailtest@example.com'));
  assert.equal(hits.length, 1);
  assert.match(hits[0], new RegExp(`keystones\\?session_id=${id}`));
  const bad = 'cs_test_' + 'n'.repeat(20);
  const r2 = await (await webhook(signed(session(bad, { amount_subtotal: 100, customer_details: { email: 'nomail@example.com' } })))).json();
  assert.equal(r2.mailed, false);
});
