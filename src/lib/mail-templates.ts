import { simpleMail } from './fulfil';
import { REPORT_VAR_KEYS, renderReport, type ReportVars } from './report';

/**
 * Every order email the app sends. Resend holds a published copy of each one (built from these
 * same render functions with {{{KEY}}} values). The app sends by template id; the local render
 * is only used for the outbox fallback.
 */
export type TemplateKey =
  | 'report' | 'report_no_answers' | 'report_no_answers_erik' | 'toolkit' | 'refresh_active'
  | 'refresh_monthly' | 'audit_intake' | 'audit_erik' | 'order_no_email_erik' | 'keystones' | 'keystones_paid' | 'keystones_cap_erik';

interface Def {
  name: string;
  subject: string;
  vars: readonly string[];
  /** true: values are plain text and get HTML-escaped before they go to Resend. */
  plain: boolean;
  render: (v: Record<string, string>) => { html: string; text: string };
  /** Keys sent to Resend as KEY_1..KEY_4, since Resend allows at most 2,000 characters per value. */
  split?: readonly string[];
}

const PARTS = 4;
const PART_MAX = 1900;
const SPLIT_KEYS = ['STORY', 'STALLS_HTML', 'STALLS_TEXT', 'FIXES_HTML', 'FIXES_TEXT', 'ANSWERS_HTML', 'ANSWERS_TEXT'] as const;

/** Rebuild KEY from KEY_1..KEY_n when KEY itself is not given (template build uses the parts). */
function joinParts(v: Record<string, string>, keys: readonly string[]) {
  const out = { ...v };
  for (const k of keys) if (out[k] === undefined) out[k] = Array.from({ length: PARTS }, (_, i) => v[`${k}_${i + 1}`] ?? '').join('');
  return out;
}

/** Variable names as Resend sees them. */
export function resendKeys(def: Def): string[] {
  return def.vars.flatMap((k) => (def.split?.includes(k) ? Array.from({ length: PARTS }, (_, i) => `${k}_${i + 1}`) : [k]));
}

export const TEMPLATES: Record<TemplateKey, Def> = {
  report: {
    name: 'TBTX order: Paid PROOF report', subject: 'PROOF report', vars: REPORT_VAR_KEYS, plain: false,
    split: SPLIT_KEYS,
    render: (v) => renderReport(joinParts(v, SPLIT_KEYS) as ReportVars),
  },
  report_no_answers: {
    name: 'TBTX order: PROOF report, answers missing (buyer)', subject: 'PROOF report: one more step', vars: [], plain: true,
    render: () => simpleMail('PROOF report: one more step', [
      "Payment for the PROOF report came through, but the answers didn't reach the report builder.",
      'Erik will email within one business day to collect the answers and send the report.',
    ]),
  },
  report_no_answers_erik: {
    name: 'TBTX notice: PROOF report without answers (Erik)', subject: 'Action needed: PROOF report without answers', vars: ['BUYER', 'SESSION_ID', 'CLIENT_REFERENCE_ID'], plain: true,
    render: (v) => simpleMail('Action needed: PROOF report without answers', [`Buyer: ${v.BUYER}`, `Stripe session: ${v.SESSION_ID}`, `client_reference_id: ${v.CLIENT_REFERENCE_ID}`]),
  },
  toolkit: {
    name: 'TBTX order: Context Rot toolkit', subject: 'Context Rot toolkit', vars: ['DOWNLOAD_URL'], plain: true,
    render: (v) => simpleMail('Context Rot toolkit', [
      'The toolkit has three files for producers and account managers, as PDFs with editable HTML copies:',
      '1. Handoff template, for every move of a job between people, teams, or the client.',
      '2. Kickoff checklist, run at the start of every job before work begins.',
      '3. Routing guide, for who gets what and when.',
      'The download link below works for this purchase. Reply to this email if it stops working.',
    ], { label: 'Download the toolkit', url: v.DOWNLOAD_URL }),
  },
  refresh_active: {
    name: 'TBTX order: PROOF Refresh active', subject: 'PROOF Refresh is active', vars: ['RETAKE_URL'], plain: true,
    render: (v) => simpleMail('PROOF Refresh is active', [
      'PROOF Refresh is set up. Each month a reminder arrives with a link to retake PROOF. Retake it with the same team in mind, then buy the full report or compare the result screen to last month.',
      'The first retake can happen now.',
      'To cancel, reply to this email.',
    ], { label: 'Retake PROOF', url: v.RETAKE_URL }),
  },
  refresh_monthly: {
    name: 'TBTX order: PROOF Refresh monthly reminder', subject: "Time for this month's PROOF", vars: ['RETAKE_URL'], plain: true,
    render: (v) => simpleMail("Time for this month's PROOF", [
      'The monthly PROOF Refresh payment went through. This is the reminder to retake PROOF.',
      'Answer for the work as it runs today. Compare where work stalls and the pattern with last month to see what moved.',
    ], { label: 'Retake PROOF', url: v.RETAKE_URL }),
  },
  audit_intake: {
    name: 'TBTX order: Remote FACT intake', subject: 'Remote FACT: intake', vars: [], plain: true,
    render: () => simpleMail('Remote FACT: intake', [
      'The Remote FACT reviews one delivery workflow and reports where it stalls and what to change first.',
      'To start, reply to this email with:',
      '1. The workflow to review, in one or two sentences, from first brief to delivery.',
      '2. Three to five real handoffs from current work: briefs, handoff notes, feedback threads or status updates. Remove anything confidential.',
      '3. The roles involved, and who owns each step.',
      '4. The one place the team notices work stalling most.',
      'Erik will confirm receipt within one business day and send the written findings after the review.',
    ]),
  },
  audit_erik: {
    name: 'TBTX notice: new Remote FACT (Erik)', subject: 'New Remote FACT purchase', vars: ['BUYER', 'SESSION_ID'], plain: true,
    render: (v) => simpleMail('New Remote FACT purchase', [`Buyer: ${v.BUYER}`, `Stripe session: ${v.SESSION_ID}`, 'Intake request sent to the buyer.']),
  },
  order_no_email_erik: {
    name: 'TBTX notice: paid order without email (Erik)', subject: 'Action needed: paid order without email', vars: ['OFFER', 'SESSION_ID'], plain: true,
    render: (v) => simpleMail('Action needed: paid order without email', [`Offer: ${v.OFFER}`, `Stripe session: ${v.SESSION_ID}`]),
  },
  keystones: {
    name: 'TBTX order: Context Keystones delivery', subject: 'Context Keystones are ready', vars: ['AGENCY', 'DOWNLOAD_URL', 'REBUILD_URL'], plain: true,
    render: (v) => simpleMail('Context Keystones are ready', [
      `The Context Keystones for ${v.AGENCY} are built from the PROOF answers and the intake.`,
      'How to start:',
      '1. Download the zip with the button below and unzip it into the folder where project files live.',
      '2. Open START HERE.md.',
      '3. Double-click the launch file for the computer in use, one for Mac and one for Windows, and pick 1 to start the first project.',
      '4. When a mandatory, a legal line or a right changes, update its one file in the _context folder, then open the menu again. The scripts carry the change into every template that uses it.',
      'The download link works for 24 hours. To change an answer or download again later, open this page and build again (up to 5 builds per purchase):',
      v.REBUILD_URL,
    ], { label: 'Download Context Keystones', url: v.DOWNLOAD_URL }),
  },
  keystones_paid: {
    name: 'TBTX order: Context Keystones intake link', subject: 'Context Keystones: the intake link', vars: ['INTAKE_URL'], plain: true,
    render: (v) => simpleMail('Payment received. The intake is next.', [
      'Thanks for buying Context Keystones.',
      "The next step is a short intake. It picks up the PROOF answers, and the pack downloads right after. If the tab got closed, this link opens the same intake again:",
      v.INTAKE_URL,
      'The link belongs to this purchase, so keep it to the team.',
    ], { label: 'Open the intake', url: v.INTAKE_URL }),
  },
  keystones_cap_erik: {
    name: 'TBTX notice: Keystones intro cap reached (Erik)', subject: 'Keystones: 50 intro sales reached', vars: ['SOLD', 'RESULT'], plain: true,
    render: (v) => simpleMail('Keystones intro cap reached', [
      `Real intro purchases: ${v.SOLD}. Checkout now sends buyers to the $349 link.`,
      `Intro link status: ${v.RESULT}`,
    ]),
  },
};

/** Published Resend template ids (created 2026-10-23). */
export const TEMPLATE_IDS: Record<TemplateKey, string> = {
  report: 'e6864538-153f-444a-8594-8b65de92f312',
  report_no_answers: 'b6c48281-8a4b-49ed-92ce-f3c9c0623098',
  report_no_answers_erik: '03c8e79d-f3dc-4345-aeaa-c0190f2b3d14',
  toolkit: '7d704253-0f63-4b5f-b15a-c321f028a7a4',
  refresh_active: '1cf7651f-fc33-49fa-9902-7751913d858f',
  refresh_monthly: 'bead4f11-073e-45e7-b799-49512a0efb71',
  audit_intake: '5a37052d-a160-4aca-90eb-75d21c831993',
  audit_erik: '59faf04e-15a1-43f7-a8a1-c3949f92edff',
  order_no_email_erik: '1ccdce02-b3c4-4547-9423-d95ffe9b7295',
  keystones: '',
  keystones_paid: '',
  keystones_cap_erik: '',
};

const escHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Build one order email: local html/text for the fallback, plus the template id and variables for Resend. */
export function templated(key: TemplateKey, values: Record<string, string>, subject?: string) {
  const def = TEMPLATES[key];
  const missing = def.vars.filter((k) => typeof values[k] !== 'string');
  if (missing.length) throw new Error(`template ${key} missing variables: ${missing.join(', ')}`);
  const variables: Record<string, string> = {};
  let fits = true;
  for (const k of def.vars) {
    const value = def.plain ? escHtml(values[k]) : values[k];
    if (def.split?.includes(k)) {
      for (let i = 0; i < PARTS; i += 1) variables[`${k}_${i + 1}`] = value.slice(i * PART_MAX, (i + 1) * PART_MAX);
      if (value.length > PARTS * PART_MAX) fits = false;
    } else {
      variables[k] = value;
      if (value.length > 2000) fits = false;
    }
  }
  const { html, text } = def.render(values);
  // A value too long for Resend: send the same rendered copy without the template.
  return { subject: subject ?? def.subject, html, text, template: fits && TEMPLATE_IDS[key] ? { key, id: TEMPLATE_IDS[key], variables } : undefined };
}
