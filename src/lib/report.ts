import { AUDIENCES, PROFILE_WORD, type AudienceId } from './audiences';
import { BANDS, RAW_MAX } from './math';
import { narrative } from './narrative';
import { QUESTIONS, scoreMap, type MapAnswers } from './questionnaire';
import { stageFor } from './stage';
import type { PressureId, ProfileId } from './types';

/** Full PROOF report, built only from the 15 answers. Same scoring as the result screen. */
/** Report wording for the Fragmented profile line (plainer than the on-screen copy). */
const FRAGMENTED_LINE: Record<AudienceId, string> = {
  agency: 'Campaigns depend on people, not a shared record.',
  consulting: 'Engagements depend on people, not a shared record.',
  service: 'Jobs depend on people, not a shared record.',
};

const PATTERN_LINE: Record<ProfileId, string> = {
  FRAGMENTED: 'People carry the work themselves. No shared record does.',
  STALLED: 'The work waits in the gaps between steps.',
  SCALING: 'The work moves, but the same context gets rebuilt along the way.',
  COMPOUNDING: 'Most of the work is connected. The goal is keeping it that way as the team grows.',
};

/** What to change first, one line per kind of stall. Plain steps, no tools named. */
const FIX: Record<string, string> = {
  start: "Agree on four things before any job starts: the brief, the owner, the due date and the approver. Don't start without all four.",
  handoff: "Use one short handoff note every time work moves between people or to the client: what's done, what's open, and what was decided and why.",
  next: 'Keep one list of live jobs with the next step and its owner on each line. Review it at the same time every day.',
  memory: 'Keep the brief, approvals and feedback in one record per job that anyone on the job can open.',
  learning: 'Close each job with a 15-minute review. Write down one change for the next job and add it to the kickoff checklist.',
  followup: 'Put every lead, request and client ask in one tracked list, each with an owner and a follow-up date.',
  ownership: 'Name one owner for each deliverable, in writing, at kickoff.',
  ai: 'Write short rules for AI on client work: which tools, for which tasks, and who checks the output before it moves.',
  decisions: 'Write one rule for deadline calls: who decides, with what information, and where the decision gets written down.',
  'key-person': 'Write down what only one person knows about each client: contacts, preferences and open approvals. Keep it in the job record.',
  pipeline: 'Put live jobs and pending approvals on one board the whole team can see, updated when the status changes.',
  repeat: "Keep masters and past decisions in one place that's easy to search, named the same way on every job.",
  shape: 'Pick the first stall in this report and fix it before adding any new tool or process.',
};
const FIX_GROUP: Record<PressureId, string> = {
  start: 'start', handoff: 'handoff', next: 'next', priorities: 'next', memory: 'memory', scattered: 'memory',
  tools: 'ai', ai: 'ai', learning: 'learning', loop: 'learning', followup: 'followup', 'loose-followup': 'followup',
  revenue: 'followup', 'some-manual': 'followup', ownership: 'ownership', 'informal-owner': 'ownership',
  decisions: 'decisions', 'key-person': 'key-person', pipeline: 'pipeline', 'partial-pipe': 'pipeline',
  repeat: 'repeat', 'sometimes-repeat': 'repeat', shape: 'shape',
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const REPORT_VAR_KEYS = ['AUDIENCE_LINE', 'SCORE', 'PATTERN', 'STALL_POINT', 'PATTERN_LINE', 'PROFILE_LINE', 'STORY', 'STALLS_HTML', 'STALLS_TEXT', 'FIXES_HTML', 'FIXES_TEXT', 'SCORING', 'ANSWERS_HTML', 'ANSWERS_TEXT', 'REVIEW_URL', 'RETAKE_URL'] as const;
export type ReportVars = Record<(typeof REPORT_VAR_KEYS)[number], string>;
export interface Report { subject: string; html: string; text: string; profile: ProfileId; raw: number; vars: ReportVars }

/**
 * Report layout. Values are already HTML-safe. The same function builds the Resend template
 * (each value set to {{{KEY}}}) and the local copy used for the outbox fallback.
 */
export function renderReport(v: ReportVars): { html: string; text: string } {
  const m = '#d01e98';
  const h2 = (t: string) => `<h2 style="font-size:20px;margin:28px 0 8px;border-top:2px solid #1F1F1F;padding-top:10px">${t}</h2>`;
  const p = (t: string) => `<p style="margin:0 0 10px">${t}</p>`;
  const html = `<!doctype html><html><body style="margin:0;background:#E9E5DE"><div style="max-width:680px;margin:0 auto;padding:28px 22px;font-family:Helvetica,Arial,sans-serif;color:#1F1F1F;font-size:16px;line-height:1.5;background:#F4F1EA">
<img src="https://transformby10x.ai/offers/k2-tbtx-wordmark-ink.png" alt="tbtx" width="72" height="36" style="display:block;border:0;height:36px;width:auto"><p style="font-weight:700;letter-spacing:.1em;font-size:12px;margin:12px 0 0">PROOF REPORT</p>
<h1 style="font-size:40px;line-height:1;letter-spacing:-.03em;margin:14px 0 6px">Where the work <span style="color:${m}">stalls</span>.</h1>
${p(v.AUDIENCE_LINE)}
<table style="width:100%;border-collapse:collapse;margin:16px 0" cellpadding="8"><tr>
<td style="border:1px solid #1F1F1F"><div style="font-size:12px;font-weight:700">SCORE</div><div style="font-size:24px;font-weight:700">${v.SCORE}</div></td>
<td style="border:1px solid #1F1F1F"><div style="font-size:12px;font-weight:700">PATTERN</div><div style="font-size:24px;font-weight:700">${v.PATTERN}</div></td>
<td style="border:1px solid #1F1F1F"><div style="font-size:12px;font-weight:700">STALL POINT</div><div style="font-size:18px;font-weight:700">${v.STALL_POINT}</div></td></tr></table>
${h2('What the answers show')}${p(v.PATTERN_LINE)}${p(v.PROFILE_LINE)}${p(v.STORY)}
${h2('Where the work stalls')}${v.STALLS_HTML}
${h2('What to change first')}<ol>${v.FIXES_HTML}</ol>
${h2('How this was scored')}${p(v.SCORING)}
${h2('What it costs')}${p("PROOF doesn't measure hours. To price the stall, enter team size, average salary, and weekly hours spent rebuilding context on the PROOF result screen. The figure is an estimate of paid time, not money saved.")}
${h2('The 15 answers')}<table style="width:100%;border-collapse:collapse;font-size:14px" cellpadding="6">${v.ANSWERS_HTML}</table>
${h2('Next steps')}${p('The Remote mini FACT reads real handoffs from current work. FACT is the full version on site.')}
<p style="margin:18px 0"><a href="${v.REVIEW_URL}" style="background:${m};color:#fff;text-decoration:none;padding:12px 18px;font-weight:700;display:inline-block">Book a PROOF Review call</a></p>
${p(`Retake PROOF: ${v.RETAKE_URL}`)}
<p style="font-size:13px;margin-top:24px;border-top:1px solid #1F1F1F;padding-top:10px">Questions about this report: reply to this email or write to erik@transformby10x.ai.</p>
</div></body></html>`;
  const text = [
    'PROOF REPORT', v.AUDIENCE_LINE, '',
    `Score: ${v.SCORE}`, `Pattern: ${v.PATTERN}`, `Stall point: ${v.STALL_POINT}`, '',
    'WHAT THE ANSWERS SHOW', v.PATTERN_LINE, v.PROFILE_LINE, v.STORY, '',
    'WHERE THE WORK STALLS', v.STALLS_TEXT, '',
    'WHAT TO CHANGE FIRST', v.FIXES_TEXT, '',
    'THE 15 ANSWERS', v.ANSWERS_TEXT, '',
    `Book a PROOF Review call: ${v.REVIEW_URL}`, `Retake PROOF: ${v.RETAKE_URL}`,
  ].join('\n');
  return { html, text };
}

export function buildReport(audienceId: AudienceId, answers: MapAnswers, retakeUrl: string, reviewUrl: string): Report | null {
  const score = scoreMap(answers);
  if (!score) return null;
  const audience = AUDIENCES[audienceId];
  const label = (id: PressureId) => audience.pressure[id];
  const p0 = score.pressures[0];
  const stage = p0 ? stageFor(audienceId, p0) : null;
  const band = BANDS.find((b) => b.id === score.profile)!;
  const profileLine = score.profile === 'FRAGMENTED' ? FRAGMENTED_LINE[audienceId] : audience.profile[score.profile];
  const story = narrative({ audienceId, profile: score.profile, pressures: score.pressures, label });

  const byStage: Array<{ stage: string; items: string[] }> = [];
  for (const id of score.allPressures) {
    const s = stageFor(audienceId, id);
    let row = byStage.find((r) => r.stage === s);
    if (!row) { row = { stage: s, items: [] }; byStage.push(row); }
    if (!row.items.includes(label(id))) row.items.push(label(id));
  }

  const fixes: string[] = [];
  for (const id of score.allPressures) {
    const f = FIX[FIX_GROUP[id]];
    if (f && !fixes.includes(f)) fixes.push(f);
    if (fixes.length === 3) break;
  }
  if (!fixes.length) fixes.push('Keep the shared record current as the team grows. Retake PROOF each month to catch a new stall early.');

  const answered = QUESTIONS.map((q, i) => {
    const c = q.choices.find((x) => x.id === answers.optionIds[i])!;
    const k = q.choices.indexOf(c);
    return { q: audience.questions[i] ?? q.text, a: audience.choices[i]?.[k] ?? c.text, v: c.value };
  });

  const pe = (t: string) => `<p style="margin:0 0 10px">${esc(t)}</p>`;
  const vars: ReportVars = {
    AUDIENCE_LINE: esc(`${audience.label}. 15 of 15 answers.`),
    SCORE: `${score.raw} of ${RAW_MAX}`,
    PATTERN: esc(PROFILE_WORD[score.profile]),
    STALL_POINT: esc(stage ?? 'None stood out'),
    PATTERN_LINE: esc(PATTERN_LINE[score.profile]),
    PROFILE_LINE: esc(profileLine),
    STORY: esc(story),
    STALLS_HTML: byStage.length ? byStage.map((r) => `<p style="margin:0 0 4px;font-weight:700">${esc(r.stage)}</p><ul style="margin:0 0 12px">${r.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`).join('') : pe('No single stage stood out. What friction there is sits across the route.'),
    STALLS_TEXT: (byStage.length ? byStage.flatMap((r) => [r.stage, ...r.items.map((i) => `- ${i}`)]) : ['No single stage stood out.']).join('\n'),
    FIXES_HTML: fixes.map((f) => `<li style="margin:0 0 8px">${esc(f)}</li>`).join(''),
    FIXES_TEXT: fixes.map((f, i) => `${i + 1}. ${f}`).join('\n'),
    SCORING: esc(`Each answer is worth 0, 1, or 2 points. The total is ${score.raw} of ${RAW_MAX}, which reads ${PROFILE_WORD[score.profile]} (${band.from} to ${band.to}). The bands are 0 to 7 Fragmented, 8 to 14 Stalled, 15 to 22 Scaling, and 23 to 30 Compounding. The stall point is the stage named by the lowest-scoring answer. PROOF doesn't name a department. Placing the stall inside the business is Friction Audit work.`),
    ANSWERS_HTML: answered.map((r, i) => `<tr><td style="border-top:1px solid #1F1F1F33;width:24px;vertical-align:top">${i + 1}</td><td style="border-top:1px solid #1F1F1F33">${esc(r.q)}<br><b>${esc(r.a)}</b></td><td style="border-top:1px solid #1F1F1F33;width:40px;text-align:right;vertical-align:top">${r.v} pt</td></tr>`).join(''),
    ANSWERS_TEXT: answered.map((r, i) => `${i + 1}. ${r.q} ${r.a} (${r.v} pt)`).join('\n'),
    REVIEW_URL: esc(reviewUrl),
    RETAKE_URL: esc(retakeUrl),
  };
  const { html, text } = renderReport(vars);

  return { subject: `PROOF report: ${PROFILE_WORD[score.profile]}, stall point ${stage ?? 'none'}`, html, text, profile: score.profile, raw: score.raw, vars };
}
