'use client';

import { useState } from 'react';
import { AUDIENCES, PROFILE_WORD, type AudienceId } from '../lib/audiences';
import { BANDS, HOURS_PER_YEAR, RAW_MAX, WEEKS_PER_YEAR, estimate } from '../lib/math';
import { narrative } from '../lib/narrative';
import { stageFor } from '../lib/stage';
import type { scoreMap } from '../lib/questionnaire';
import type { ProfileId } from '../lib/types';
import { KeystonesPreview } from './KeystonesPreview';

export const REVIEW_URL = process.env.NEXT_PUBLIC_PROOF_BOOKING_URL || 'https://calendar.app.google/ecuH2cxigdh5NQKy9';
const FRICTION_MODEL_URL = 'https://transformby10x.ai/review/friction-model/index.html';

/** One ladder, used on the result page and in the footer sheet. */
export const LADDER: ReadonlyArray<readonly [string, string]> = [
  ['PROOF', 'Free. 15 answers. Your summary and your stall point.'],
  ['Review your PROOF', 'Free. 45 minutes. We go through your summary and decide if the stall is worth fixing.'],
  ['Friction Audit', 'Paid, fixed scope, 2 weeks. Price covered on the call. We measure your real handoffs. You get your FACT report and your BizBlueprint.'],
  ['BizBlueprint', 'Names the Keystones your route needs, and where each one goes.'],
  ['Install', 'BizBuilders AI installs your Keystones.'],
  ['The Pipeline Airlock', 'Built by BizBuilders AI.'],
];

const PATTERN_LINE: Record<ProfileId, string> = {
  FRAGMENTED: 'People hold the work together. No shared record does.',
  STALLED: 'The work waits in the gaps between steps.',
  SCALING: 'The work moves, but the same context gets rebuilt along the way.',
  COMPOUNDING: 'The route is mostly connected. The job is keeping it that way.',
};

type Score = NonNullable<ReturnType<typeof scoreMap>>;

export function Arrow() {
  return (
    <svg className="px-arrow" width="18" height="12" viewBox="0 0 18 12" aria-hidden="true">
      <path d="M0 6h16M11 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ReviewCta({ note, sub }: { note: string; sub: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="px-actions px-res-cta">
      <a
        className="px-btn px-btn-light"
        href={REVIEW_URL}
        target="_blank"
        rel="noopener"
        onClick={() => {
          try {
            void navigator.clipboard?.writeText(note).then(() => setCopied(true), () => undefined);
          } catch {
            // Clipboard can be blocked. The calendar still opens.
          }
        }}
      >
        Review your PROOF <Arrow />
      </a>
      <p className="px-meta">{copied ? 'Your summary is copied. Paste it in the booking note.' : sub}</p>
    </div>
  );
}

export function Ladder({ light = false }: { light?: boolean }) {
  return (
    <ol className={light ? 'px-ks-ladder is-light' : 'px-ks-ladder'} aria-label="What happens next">
      {LADDER.map(([name, line], i) => (
        <li key={name} className={i === 0 ? 'is-here' : undefined}>
          <span className="px-no">{String(i + 1).padStart(2, '0')}</span>
          <strong>{name}</strong>
          <em>{line}</em>
        </li>
      ))}
    </ol>
  );
}

export function Result({ audienceId, score, restart }: { audienceId: AudienceId; score: Score; restart: () => void }) {
  const audience = AUDIENCES[audienceId];
  const p0 = score.pressures[0];
  const stage = p0 ? stageFor(audienceId, p0) : null;
  const first = p0 ? audience.pressure[p0] : null;
  const story = narrative({ audienceId, profile: score.profile, pressures: score.pressures, label: (id) => audience.pressure[id] });
  const band = BANDS.find((b) => b.id === score.profile)!;
  const note = `PROOF summary\nBusiness: ${audience.label}\nPattern: ${PROFILE_WORD[score.profile]} (${score.raw} of ${RAW_MAX})\nStall point: ${stage ?? 'None stood out'}${first ? `\nWhat it looks like: ${first}` : ''}\n\n${story}`;

  return (
    <section className="px-result px-res" aria-labelledby="px-done">
      <div className="px-res-col">
        <h1 id="px-done" className="px-done" tabIndex={-1}>
          <span>Your PROOF results</span>
        </h1>

        <div className="px-res-facts">
          <div>
            <p className="px-res-label">Pattern</p>
            <p className="px-res-value">{PROFILE_WORD[score.profile]}</p>
            <p className="px-res-sub">{score.raw} of {RAW_MAX}. {PATTERN_LINE[score.profile]}</p>
          </div>
          <div>
            <p className="px-res-label">Stall point</p>
            <p className="px-res-value">{stage ?? 'None stood out'}</p>
            <p className="px-res-sub">{first ? `${first}.` : 'The friction is spread across the route.'}</p>
          </div>
          <div>
            <p className="px-res-label">What you&rsquo;re feeling</p>
            <p className="px-res-sub px-res-feel">{audience.profile[score.profile]}</p>
          </div>
        </div>

        <details className="px-res-how">
          <summary>How we scored this</summary>
          <p>
            Each answer is worth 0, 1, or 2 points. Your total is {score.raw} of {RAW_MAX}, which reads {PROFILE_WORD[score.profile]} ({band.from} to {band.to}). The bands are 0 to 7 Fragmented, 8 to 14 Stalled, 15 to 22 Scaling, and 23 to 30 Compounding.
          </p>
          <p>
            The stall point is the stage of work named by your lowest-scoring answer. {score.allPressures.length ? `${score.allPressures.length} of your answers point to a stage worth a look.` : 'None of your answers pointed to one stage.'} PROOF does not name a department. Placing the stall inside your business is Friction Audit work.
          </p>
        </details>

        <section className="px-res-sum" aria-labelledby="px-sum-h">
          <p id="px-sum-h" className="px-res-label">Your summary</p>
          <p className="px-res-story">{story}</p>
          {score.pressures.length ? (
            <>
              <p className="px-res-label">Where it shows up</p>
              <ul className="px-res-list">
                {score.pressures.map((id) => (
                  <li key={id}>{audience.pressure[id]}</li>
                ))}
              </ul>
            </>
          ) : null}
          <ReviewCta note={note} sub="Free. 45 minutes. We go through your summary and your stall point with you." />
        </section>

        <KeystonesPreview audienceId={audienceId} stage={stage} />

        <Estimate />

        <section className="px-ks px-res-next" aria-labelledby="px-next-h">
          <div className="px-ks-head">
            <h2 id="px-next-h">What happens next</h2>
          </div>
          <Ladder />
          <ReviewCta note={note} sub="Free. 45 minutes. No commitment until the Friction Audit." />
        </section>

        <p className="px-result-links">
          <button type="button" onClick={restart}>Redo PROOF</button>
        </p>
      </div>
    </section>
  );
}

const usd0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const usd2 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (v: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(v);

function Estimate() {
  const [team, setTeam] = useState('');
  const [salary, setSalary] = useState('');
  const [hours, setHours] = useState('');
  const t = Number(team);
  const s = Number(salary);
  const h = Number(hours);
  const ready = t > 0 && s > 0 && h > 0;
  const e = ready ? estimate(t, s, h) : null;
  const field = (label: string, value: string, set: (v: string) => void, placeholder: string, unit?: string) => (
    <label className="px-est-field">
      <span>{label}</span>
      <span className="px-est-input">
        {unit === '$' ? <i>$</i> : null}
        <input type="number" inputMode="decimal" min={0} placeholder={placeholder} value={value} onChange={(ev) => set(ev.target.value)} />
        {unit && unit !== '$' ? <i>{unit}</i> : null}
      </span>
    </label>
  );
  return (
    <section className="px-est" aria-labelledby="px-est-h">
      <div className="px-est-head">
        <h2 id="px-est-h">What carrying context by hand costs you</h2>
        <p className="px-est-sub">Payroll hours spent repairing context, per year.</p>
        <p>Capacity-cost equivalent, not cash savings or ROI</p>
      </div>
      <div className="px-est-fields">
        {field('People on the team', team, setTeam, 'e.g. 6', 'people')}
        {field('Average salary', salary, setSalary, 'e.g. 90000', '$')}
        {field('Hours a week each person spends finding, checking, or rebuilding work', hours, setHours, 'e.g. 5', 'h')}
      </div>
      <div aria-live="polite">
        {e ? (
          <>
            <p className="px-est-result">
              That is <b className="px-est-total">{usd0.format(e.annual)}</b> a year in paid time spent repairing context.
            </p>
            <p className="px-est-plain">
              {num(h)} hours × {num(t)} people × {usd2.format(e.hourly)} an hour × {WEEKS_PER_YEAR} weeks.
            </p>
            <details className="px-res-how">
              <summary>Show the math</summary>
              <ol className="px-est-steps">
                <li>
                  <span className="px-eq">Hourly cost = {usd0.format(s)} ÷ {num(HOURS_PER_YEAR)} = <b>{usd2.format(e.hourly)}</b></span>
                  <small>What one paid hour costs. 2,080 is 40 hours over 52 weeks.</small>
                </li>
                <li>
                  <span className="px-eq">Weekly = {num(h)} × {num(t)} × {usd2.format(e.hourly)} = <b>{usd2.format(e.weekly)}</b></span>
                  <small>Paid time spent each week repairing work that arrived without what it needed.</small>
                </li>
                <li>
                  <span className="px-eq">Yearly = {usd2.format(e.weekly)} × {WEEKS_PER_YEAR} = <b className="px-est-total">{usd0.format(e.annual)}</b></span>
                  <small>Equal to {num(Math.round(e.salaryShare * 1000) / 10)}% of one {usd0.format(s)} salary.</small>
                </li>
              </ol>
            </details>
          </>
        ) : (
          <p className="px-est-result is-empty">Enter your three numbers to see the figure.</p>
        )}
      </div>
      <p className="px-est-note">These hours are your own estimate. The figure prices that time. It does not predict money saved.</p>
      <p className="px-est-bridge">
        This uses 2 of the 9 measures in the Friction Model. <a href={FRICTION_MODEL_URL}>The Friction Audit runs all 9 on your real handoffs and reports them in your FACT report.</a>
      </p>
    </section>
  );
}
