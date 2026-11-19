import { createHmac, timingSafeEqual } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

/** Server-only helpers for paid offers: Stripe signature check, send log, email. */
export const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const LOG = path.join(DATA_DIR, 'fulfilment-log.json');
export const PUBLIC_BASE = process.env.PUBLIC_BASE_URL || 'https://transformby10x.ai/proof/screen';
export const ERIK = process.env.NOTIFY_EMAIL || 'erik@transformby10x.ai';

export function verifyStripe(raw: string, header: string | null, secret: string, toleranceSec = 300): boolean {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(header.split(',').map((kv) => kv.split('=') as [string, string]).filter((x) => x.length === 2).map(([k, v]) => [k, v]));
  const t = Number(parts.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > toleranceSec) return false;
  const expected = createHmac('sha256', secret).update(`${t}.${raw}`).digest();
  return header.split(',').filter((kv) => kv.startsWith('v1=')).some((kv) => {
    const got = Buffer.from(kv.slice(3), 'hex');
    return got.length === expected.length && timingSafeEqual(got, expected);
  });
}

export interface LogEntry { key: string; kind: string; email: string | null; status: string; at: string; detail?: string }

async function readLog(): Promise<LogEntry[]> {
  try { return JSON.parse(await fs.readFile(LOG, 'utf8')) as LogEntry[]; } catch { return []; }
}
let chain: Promise<unknown> = Promise.resolve();
export async function findEntry(key: string): Promise<LogEntry | undefined> {
  return (await readLog()).find((e) => e.key === key);
}
export function addEntry(entry: LogEntry): Promise<void> {
  const run = chain.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const log = await readLog();
    log.push(entry);
    const tmp = `${LOG}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(log, null, 1));
    await fs.rename(tmp, LOG);
  });
  chain = run.catch(() => undefined);
  return run;
}

export interface Mail {
  to: string; subject: string; html: string; text: string; replyTo?: string; attachments?: Array<{ filename: string; content: string }>;
  /** Resend template to send by id. html/text above stay as the outbox fallback copy. */
  template?: { key: string; id: string; variables: Record<string, string> };
  /** Resend Idempotency-Key: one per Stripe event per email. */
  idempotencyKey?: string;
}

/** Sends through Resend (by template id when given, with an idempotency key and retries on network errors, 429 and 5xx) when RESEND_API_KEY is set, else SMTP when SMTP_* is set. Any failure, or no sender, writes to data/outbox. Every send is logged. */
export async function sendMail(mail: Mail): Promise<{ ok: boolean; via: string; id?: string; error?: string }> {
  const result = await sendMailInner(mail);
  console.log('[mail]', JSON.stringify({ via: result.via, ok: result.ok, to: mail.to, subject: mail.subject, template: mail.template?.id, idem: mail.idempotencyKey, id: result.id, error: result.error }));
  return result;
}

async function sendMailInner(mail: Mail): Promise<{ ok: boolean; via: string; id?: string; error?: string }> {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  if (!process.env.RESEND_API_KEY && SMTP_HOST && SMTP_USER && SMTP_PASS) {
    try {
      const nodemailer = await import('nodemailer');
      const port = Number(process.env.SMTP_PORT || 465);
      const transport = nodemailer.createTransport({ host: SMTP_HOST, port, secure: port === 465, auth: { user: SMTP_USER, pass: SMTP_PASS }, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000 });
      const from = (process.env.MAIL_FROM || `Erik @ TransformBy10X <${SMTP_USER}>`).replace(/^['"](.*)['"]$/, '$1');
      const info = await transport.sendMail({ from, to: mail.to, replyTo: mail.replyTo || ERIK, subject: mail.subject, html: mail.html, text: mail.text });
      return { ok: true, via: 'smtp', id: info.messageId };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      const queued = await writeOutbox(mail, `smtp failed: ${error}`);
      return { ok: true, via: 'outbox-smtp-failed', id: queued, error };
    }
  }
  const key = process.env.RESEND_API_KEY;
  if (key) {
    const from = (process.env.MAIL_FROM || 'TransformBy10X <erik@transformby10x.ai>').replace(/^['"](.*)['"]$/, '$1');
    const base = { from, to: [mail.to], subject: mail.subject, reply_to: mail.replyTo || ERIK };
    const payload = mail.template?.id
      ? { ...base, template: { id: mail.template.id, variables: mail.template.variables } }
      : { ...base, html: mail.html, text: mail.text };
    const headers: Record<string, string> = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
    if (mail.idempotencyKey) headers['Idempotency-Key'] = mail.idempotencyKey.slice(0, 256);
    let error = 'not sent';
    for (let attempt = 0; attempt < 4; attempt += 1) {
      let wait = 500 * 2 ** attempt;
      try {
        const res = await fetch('https://api.resend.com/emails', { method: 'POST', headers, body: JSON.stringify(payload) });
        const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string; name?: string };
        if (res.ok) return { ok: true, via: mail.template ? `resend-template:${mail.template.key}` : 'resend', id: body.id };
        error = `${res.status} ${body.name ?? ''} ${body.message ?? ''}`.trim();
        const retryable = res.status === 429 || res.status >= 500 || (res.status === 409 && body.name === 'concurrent_idempotent_requests');
        if (!retryable) break;
        const ra = Number(res.headers.get('retry-after'));
        if (ra > 0) wait = Math.min(ra * 1000, 10000);
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);
      }
      if (attempt < 3) await new Promise((r) => setTimeout(r, wait));
    }
    return { ok: true, via: 'outbox-resend-failed', id: await writeOutbox(mail, `resend failed: ${error}`), error };
  }
  return { ok: true, via: 'outbox', id: await writeOutbox(mail) };
}

async function writeOutbox(mail: Mail, reason?: string): Promise<string> {
  const dir = path.join(DATA_DIR, 'outbox');
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, `${new Date().toISOString().replace(/[:.]/g, '-')}-${Math.random().toString(36).slice(2, 8)}.json`);
  await fs.writeFile(file, JSON.stringify({ ...mail, attachments: mail.attachments?.map((a) => a.filename), reason }, null, 1));
  return path.basename(file);
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/** Simple branded email: paragraphs plus optional button. */
export function simpleMail(title: string, paras: string[], button?: { label: string; url: string }): { html: string; text: string } {
  const html = `<!doctype html><html><body style="margin:0;background:#E9E5DE"><div style="max-width:620px;margin:0 auto;padding:28px 22px;font-family:Helvetica,Arial,sans-serif;color:#1F1F1F;font-size:16px;line-height:1.5;background:#F4F1EA">
<img src="https://transformby10x.ai/offers/k2-tbtx-wordmark-ink.png" alt="tbtx" width="72" height="36" style="display:block;border:0;height:36px;width:auto"><h1 style="font-size:30px;line-height:1.05;margin:12px 0 16px">${esc(title)}</h1>
${paras.map((t) => `<p style="margin:0 0 12px">${esc(t)}</p>`).join('')}
${button ? `<p style="margin:20px 0"><a href="${esc(button.url)}" style="background:#d01e98;color:#fff;text-decoration:none;padding:12px 18px;font-weight:700;display:inline-block">${esc(button.label)}</a></p><p style="font-size:13px">${esc(button.url)}</p>` : ''}
<p style="font-size:13px;margin-top:24px;border-top:1px solid #1F1F1F;padding-top:10px">Erik Bush, TransformBy10X. Reply to this email with any question.</p></div></body></html>`;
  const text = [title, '', ...paras, ...(button ? ['', `${button.label}: ${button.url}`] : []), '', 'Erik Bush, TransformBy10X'].join('\n');
  return { html, text };
}
