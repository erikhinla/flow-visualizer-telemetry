import { NextResponse } from 'next/server';
import { REVIEW_URL } from '../../../../lib/links';
import { decodeProof } from '../../../../lib/proof-code';
import { buildReport } from '../../../../lib/report';
import { ERIK, PUBLIC_BASE, addEntry, findEntry, latestEntry, sendMail, verifyStripe, withDataLock, type Mail } from '../../../../lib/fulfil';
import { templated, type TemplateKey } from '../../../../lib/mail-templates';
import { KEYSTONES_PRODUCT, assessKeystonesSession } from '../../../../lib/keystones-catalog';
import { checkoutRetrieveConfigured, retrieveCheckoutSession } from '../../../../lib/keystones-retrieve';
import { FULL_LINK, INTRO_LINK, CURRENT_FULL_LINK, CURRENT_INTRO_LINK, closeIntroIfCapped } from '../../../../lib/keystones-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Live Stripe Payment Links and prices for the four paid offers. */
const LINKS: Record<string, 'report' | 'toolkit' | 'refresh' | 'audit' | 'keystones'> = {
  plink_1UThXdCMxQwcbhDndm8NLuU2: 'report',
  plink_1UThXfCMxQwcbhDnT4aqhmyA: 'toolkit',
  plink_1UThXhCMxQwcbhDnN7aXSTIH: 'refresh',
  plink_1UThXjCMxQwcbhDnMwgfeKkR: 'audit',
  [INTRO_LINK]: 'keystones',
  [FULL_LINK]: 'keystones',
  [CURRENT_INTRO_LINK]: 'keystones',
  [CURRENT_FULL_LINK]: 'keystones',
};
const REFRESH_PRICE = 'price_1UThXWCMxQwcbhDnF4MLaeOL';
const RETAKE = `${PUBLIC_BASE}/`;

type Obj = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

/** One order email by Resend template, with an idempotency key per Stripe object per email. */
function tm(to: string, idem: string, key: TemplateKey, values: Record<string, string> = {}, extra: Partial<Mail> = {}, subject?: string): Mail {
  const t = templated(key, values, subject);
  return { to, subject: t.subject, html: t.html, text: t.text, template: t.template, idempotencyKey: `${idem}:${key}`, ...extra };
}

function mailsFor(kind: string, session: Obj, email: string, idem: string): { mails: Mail[]; note?: string } {
  const name = session.customer_details?.name ? String(session.customer_details.name) : null;
  const buyer = `${email}${name ? ` (${name})` : ''}`;
  if (kind === 'report') {
    const decoded = decodeProof(session.client_reference_id);
    const report = decoded ? buildReport(decoded.audienceId, decoded.answers, RETAKE, REVIEW_URL) : null;
    if (!report) {
      return { mails: [
        tm(email, idem, 'report_no_answers'),
        tm(ERIK, idem, 'report_no_answers_erik', { BUYER: buyer, SESSION_ID: String(session.id), CLIENT_REFERENCE_ID: String(session.client_reference_id ?? 'none') }),
      ], note: 'no-answers' };
    }
    return { mails: [tm(email, idem, 'report', report.vars, {}, report.subject)], note: `${report.profile} ${report.raw}` };
  }
  if (kind === 'toolkit') {
    return { mails: [tm(email, idem, 'toolkit', { DOWNLOAD_URL: `${PUBLIC_BASE}/api/toolkit?s=${encodeURIComponent(session.id)}` })] };
  }
  if (kind === 'refresh') return { mails: [tm(email, idem, 'refresh_active', { RETAKE_URL: RETAKE })] };
  return { mails: [
    tm(email, idem, 'audit_intake', {}, { replyTo: ERIK }),
    tm(ERIK, idem, 'audit_erik', { BUYER: buyer, SESSION_ID: String(session.id) }),
  ] };
}

/** Intake email is its own ledger row. A failed send stays retryable without a second entitlement. */
async function ensureIntakeMail(sessionKey: string, email: string | null, sessionId: string): Promise<{ mailed: boolean; retry: boolean }> {
  if (!email) return { mailed: false, retry: false };
  const mailKey = `mail:${sessionKey}:intake`;
  const prev = await latestEntry(mailKey);
  if (prev && prev.status !== 'failed') return { mailed: prev.status === 'sent' || prev.status === 'queued', retry: false };
  const r = await sendMail(tm(email, `${sessionKey}:paid`, 'keystones_paid', { INTAKE_URL: `${PUBLIC_BASE}/keystones?session_id=${encodeURIComponent(sessionId)}` }));
  const failed = !r.ok || r.via.includes('failed');
  await addEntry({ key: mailKey, kind: 'keystones-mail', email, status: failed ? 'failed' : (r.via === 'outbox' ? 'queued' : 'sent'), at: new Date().toISOString(), detail: [r.via, r.error].filter(Boolean).join(' | ') });
  return { mailed: !failed, retry: failed };
}

async function deliver(key: string, kind: string, email: string, mails: Mail[], note?: string) {
  const results = [];
  for (const mail of mails) {
    const r = await sendMail(mail);
    results.push(r);
    if (!r.ok) throw new Error(`send failed (${mail.subject}): ${r.error}`);
  }
  const via = results.map((r) => r.via).join(',');
  const ids = results.map((r) => r.id).filter(Boolean).join(',');
  await addEntry({ key, kind, email, status: via.includes('outbox') ? 'queued-outbox' : 'sent', at: new Date().toISOString(), detail: [note, via, ids].filter(Boolean).join(' | ') });
  return via;
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET || '';
  const raw = await req.text();
  if (!verifyStripe(raw, req.headers.get('stripe-signature'), secret)) {
    return NextResponse.json({ error: 'bad signature' }, { status: 400 });
  }
  const event = JSON.parse(raw) as Obj;
  const obj = event.data?.object as Obj;
  try {
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const kind = LINKS[String(obj.payment_link)];
      if (!kind) return NextResponse.json({ ok: true, skipped: 'other link' });
      if (kind !== 'keystones' && obj.payment_status !== 'paid') return NextResponse.json({ ok: true, skipped: 'not paid yet' });
      const key = `cs:${obj.id}`;
      const email = obj.customer_details?.email || obj.customer_email;
      if (kind === 'keystones') {
        if (!checkoutRetrieveConfigured()) {
          return NextResponse.json({ error: 'checkout retrieve is not configured' }, { status: 500 });
        }
        const retrieved = await retrieveCheckoutSession(String(obj.id)) as Obj;
        if (String(retrieved.id ?? '') !== String(obj.id ?? '')) {
          return NextResponse.json({ error: 'retrieved session did not match the event' }, { status: 500 });
        }
        const assessed = assessKeystonesSession(retrieved);
        const code = /^p1_[acs]_[1-4]+$/.test(String(retrieved.client_reference_id ?? obj.client_reference_id ?? '')) ? String(retrieved.client_reference_id ?? obj.client_reference_id) : '';
        const buyer = retrieved.customer_details?.email || retrieved.customer_email || email;
        return withDataLock(async () => {
          const existing = await latestEntry(key);
          if (existing?.status === 'paid') {
            const mail = await ensureIntakeMail(key, existing.email, String(obj.id));
            return NextResponse.json({ ok: !mail.retry, duplicate: true, kind, unlocked: true, mailed: mail.mailed }, { status: mail.retry ? 500 : 200 });
          }
          if (!assessed.ok) {
            if (assessed.reason === 'unpaid' || assessed.reason === 'incomplete') return NextResponse.json({ ok: true, skipped: assessed.reason });
            if (assessed.reason === 'lines missing' || assessed.reason === 'not retrieved') {
              return NextResponse.json({ error: assessed.reason }, { status: 500 });
            }
            await addEntry({ key, kind, email: buyer ? String(buyer) : null, status: 'price-mismatch', at: new Date().toISOString(), detail: [`code=${code || 'none'}`, `sub=${retrieved.amount_subtotal}`, `total=${retrieved.amount_total}`, `link=${retrieved.payment_link}`, `reason=${assessed.reason}`].join(' | ') });
            return NextResponse.json({ ok: true, kind, unlocked: false, mailed: false, reason: assessed.reason });
          }
          await addEntry({
            key, kind, email: buyer ? String(buyer) : null, status: 'paid', at: new Date().toISOString(),
            detail: [`code=${code || 'none'}`, `sub=${assessed.subtotal}`, `total=${assessed.total}`, `link=${retrieved.payment_link}`, `price=${assessed.offer.price}`, `product=${KEYSTONES_PRODUCT}`, `qty=${assessed.quantity}`, `lines=${assessed.lines}`, `complimentary=${assessed.complimentary ? 'yes' : 'no'}`].join(' | '),
          });
          const mail = await ensureIntakeMail(key, buyer ? String(buyer) : null, String(obj.id));
          let cap = 'open';
          try { cap = await closeIntroIfCapped(); } catch (e) { console.error('[keystones-cap]', e); }
          return NextResponse.json({ ok: !mail.retry, kind, unlocked: true, mailed: mail.mailed, cap }, { status: mail.retry ? 500 : 200 });
        });
      }
      if (await findEntry(key)) return NextResponse.json({ ok: true, duplicate: true });
      if (!email) {
        await deliver(key, kind, ERIK, [tm(ERIK, key, 'order_no_email_erik', { OFFER: kind, SESSION_ID: String(obj.id) })], 'no-email');
        return NextResponse.json({ ok: true, note: 'no email' });
      }
      const { mails, note } = mailsFor(kind, obj, String(email), key);
      const via = await deliver(key, kind, String(email), mails, note);
      return NextResponse.json({ ok: true, kind, via });
    }
    if (event.type === 'invoice.paid') {
      if (obj.billing_reason !== 'subscription_cycle') return NextResponse.json({ ok: true, skipped: obj.billing_reason });
      if (!JSON.stringify(obj.lines ?? {}).includes(REFRESH_PRICE)) return NextResponse.json({ ok: true, skipped: 'other price' });
      const key = `in:${obj.id}`;
      if (await findEntry(key)) return NextResponse.json({ ok: true, duplicate: true });
      const email = obj.customer_email;
      if (!email) return NextResponse.json({ ok: true, skipped: 'no email' });
      const via = await deliver(key, 'refresh-cycle', String(email), [tm(String(email), key, 'refresh_monthly', { RETAKE_URL: RETAKE })]);
      return NextResponse.json({ ok: true, kind: 'refresh-cycle', via });
    }
    return NextResponse.json({ ok: true, ignored: event.type });
  } catch (err) {
    console.error('[stripe-webhook]', event.id, err);
    return NextResponse.json({ error: 'delivery failed' }, { status: 500 });
  }
}
