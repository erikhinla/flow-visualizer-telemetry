import { NextResponse } from 'next/server';
import { REVIEW_URL } from '../../../../lib/links';
import { decodeProof } from '../../../../lib/proof-code';
import { buildReport } from '../../../../lib/report';
import { ERIK, PUBLIC_BASE, addEntry, findEntry, sendMail, verifyStripe, type Mail } from '../../../../lib/fulfil';
import { templated, type TemplateKey } from '../../../../lib/mail-templates';
import { FULL_LINK, INTRO_LINK, SUBTOTAL, closeIntroIfCapped } from '../../../../lib/keystones-server';

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
      if (obj.payment_status !== 'paid') return NextResponse.json({ ok: true, skipped: 'not paid yet' });
      const kind = LINKS[String(obj.payment_link)];
      if (!kind) return NextResponse.json({ ok: true, skipped: 'other link' });
      const key = `cs:${obj.id}`;
      if (await findEntry(key)) return NextResponse.json({ ok: true, duplicate: true });
      const email = obj.customer_details?.email || obj.customer_email;
      if (kind === 'keystones') {
        // This entry unlocks the build. A short email carries the intake link so a closed tab doesn't lose the purchase; the pack itself is emailed when it's built.
        const priceOk = obj.currency === 'usd' && Number(obj.amount_subtotal) === SUBTOTAL[String(obj.payment_link)];
        const code = /^p1_[acs]_[1-4]+$/.test(String(obj.client_reference_id ?? '')) ? String(obj.client_reference_id) : '';
        await addEntry({ key, kind, email: email ? String(email) : null, status: priceOk ? 'paid' : 'price-mismatch', at: new Date().toISOString(), detail: [`code=${code || 'none'}`, `sub=${obj.amount_subtotal}`, `total=${obj.amount_total}`, `link=${obj.payment_link}`].join(' | ') });
        let mailed = false;
        if (priceOk && email) {
          const r = await sendMail(tm(String(email), `${key}:paid`, 'keystones_paid', { INTAKE_URL: `${PUBLIC_BASE}/keystones?session_id=${encodeURIComponent(String(obj.id))}` }));
          mailed = r.ok;
        }
        let cap = 'open';
        try { cap = await closeIntroIfCapped(); } catch (e) { console.error('[keystones-cap]', e); }
        return NextResponse.json({ ok: true, kind, unlocked: priceOk, mailed, cap });
      }
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
