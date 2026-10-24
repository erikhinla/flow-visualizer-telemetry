'use client';

import Link from 'next/link';
import { DATE_EXAMPLE, firstProjectProblems, isPast } from '@/lib/keystones-dates';
import { useEffect, useMemo, useRef, useState } from 'react';
import { KeystonesPrice, checkoutHref, useKeystonesOffer } from './KeystonesPrice';
import { decodeProof, encodeProof } from '../lib/proof-code';
import { QUESTIONS } from '../lib/questionnaire';
import { useSession } from './SessionProvider';
import SAMPLE from '../lib/keystones-sample.json';

type Dept = { name: string; lead: string; roles: string[] };
type Round = { id: string; name: string; reviewers: string[]; business_affairs: boolean; client_sees: boolean; purpose: string };
type Handoff = { from: string; to: string; items: string[] };
type Intake = {
  agency_name: string;
  departments: Dept[];
  stages: string[];
  rounds: Round[];
  deliverables: string[];
  mandatory_types: string[];
  mandatory_values: Record<string, string>;
  legal_line_types: string[];
  legal_values: Record<string, string>;
  rights_types: string[];
  usual_media: string[];
  usual_territories: string[];
  storage: string;
  change_channels: string[];
  version_style: string;
  record_owner: string;
  rights_owner: string;
  handoffs: Handoff[];
  first_project: { client: string; project: string; code: string; due: string; flight_start: string; flight_end: string };
};

const DEPTS: Array<[string, string]> = [
  ['Account', 'Account Director'], ['Strategy', 'Strategy Director'], ['Creative', 'Executive Creative Director'],
  ['Production', 'Head of Production'], ['Media', 'Media Director'], ['Business Affairs', 'Business Affairs Manager'],
  ['Legal', 'Legal Counsel'], ['Finance', 'Finance Lead'], ['Public relations', 'PR Director'],
];
const STAGES = ['Kickoff', 'Brief', 'Concept', 'Production', 'Review', 'Delivery'];
const DELIVERABLES = ['TV spots', 'Social cutdowns', 'OOH', 'Print', 'Digital display', 'Radio', 'Online video', 'Experiential'];
const MANDATORIES = ['Logo lockup', 'Tagline', 'Website URL', 'Hashtag', 'Brand colors', 'Product shot', 'Supers'];
const LEGAL = ['Offer terms', 'Disclaimer', 'Trademark notice', 'Regulatory copy', 'Contest rules'];
const RIGHTS = ['music', 'talent', 'stock footage', 'stock photos', 'fonts', 'voiceover', 'locations'];
const MEDIA = ['TV', 'Radio', 'Social', 'Online video', 'CTV', 'OOH', 'Digital OOH', 'Print', 'Display', 'Cinema'];
const STORAGE = ['cloud file storage', 'a shared server', "people's own computers", 'a mix of these'];
const CHANNELS = ['email', 'a team chat channel', 'a status meeting', 'a project tracker', 'a word in passing'];
const VERSIONS = ['v1, v2, v3 at the end of the file name', 'R1, R2, R3 for rounds', 'dates in the file name', "it varies"];

const STEPS = ['From PROOF', 'The team', 'Stages and rounds', 'The work', 'How changes move', 'First project', 'Pack'];

const blank = (): Intake => ({
  agency_name: '',
  departments: [],
  stages: [...STAGES],
  rounds: [
    { id: 'R1', name: 'Internal review', reviewers: [], business_affairs: true, client_sees: false, purpose: '' },
    { id: 'R2', name: 'Client review', reviewers: [], business_affairs: false, client_sees: true, purpose: '' },
  ],
  deliverables: [], mandatory_types: [], mandatory_values: {}, legal_line_types: [], legal_values: {},
  rights_types: [], usual_media: [], usual_territories: [], storage: STORAGE[0], change_channels: [],
  version_style: VERSIONS[0], record_owner: '', rights_owner: '', handoffs: [],
  first_project: { client: '', project: '', code: '', due: '', flight_start: '', flight_end: '' },
});

function toggle(list: string[], v: string) {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

function Chips({ label, options, value, onChange, hint }: { label: string; options: string[]; value: string[]; onChange: (v: string[]) => void; hint?: string }) {
  const [extra, setExtra] = useState('');
  const all = Array.from(new Set([...options, ...value]));
  return (
    <fieldset className="ks-field">
      <legend>{label}</legend>
      {hint ? <p className="ks-hint">{hint}</p> : null}
      <div className="ks-chips">
        {all.map((o) => (
          <button type="button" key={o} className={`ks-chip${value.includes(o) ? ' on' : ''}`} aria-pressed={value.includes(o)} onClick={() => onChange(toggle(value, o))}>
            {o}
          </button>
        ))}
      </div>
      <div className="ks-add">
        <input value={extra} placeholder="Add another" onChange={(e) => setExtra(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && extra.trim()) { e.preventDefault(); onChange([...value, extra.trim()]); setExtra(''); } }} />
        <button type="button" className="ks-ghost" disabled={!extra.trim()} onClick={() => { onChange([...value, extra.trim()]); setExtra(''); }}>Add</button>
      </div>
    </fieldset>
  );
}

function Text({ label, value, onChange, placeholder, hint, type = 'text', problem, note, inputMode }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string; type?: string; problem?: string; note?: string; inputMode?: 'numeric' | 'text' }) {
  return (
    <label className="ks-field">
      <span className="ks-label">{label}</span>
      {hint ? <span className="ks-hint">{hint}</span> : null}
      <input type={type} value={value} placeholder={placeholder} inputMode={inputMode} aria-invalid={problem ? true : undefined} onChange={(e) => onChange(e.target.value)} />
      {problem ? <span className="ks-field-error" role="alert">{problem}</span> : note ? <span className="ks-field-note">{note}</span> : null}
    </label>
  );
}

function Radio({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <fieldset className="ks-field">
      <legend>{label}</legend>
      <div className="ks-radios">
        {options.map((o) => (
          <label key={o} className={`ks-radio${value === o ? ' on' : ''}`}>
            <input type="radio" checked={value === o} onChange={() => onChange(o)} /> {o}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function defaultHandoffs(names: string[]): Handoff[] {
  const pairs: Array<[string, string]> = [['Strategy', 'Creative'], ['Creative', 'Production'], ['Production', 'Media'], ['Account', 'Business Affairs'], ['Account', 'Legal']];
  return pairs.filter(([a, b]) => names.includes(a) && names.includes(b)).map(([from, to]) => ({ from, to, items: [] }));
}

export function KeystonesIntake() {
  const { ready, session } = useSession();
  const [step, setStep] = useState(0);
  const [I, setI] = useState<Intake>(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState<{ url: string; name: string; size: number; emailed: boolean } | null>(null);
  const [sessionId, setSessionId] = useState('');
  const [gate, setGate] = useState<'checking' | 'paid' | 'pending' | 'unpaid'>('checking');
  const [buildsLeft, setBuildsLeft] = useState(0);
  const [code, setCode] = useState<string | null>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const offer = useKeystonesOffer();
  const base = process.env.NEXT_PUBLIC_PROOF_BASE_PATH ?? '';

  // The checkout session comes back in the URL. Keep it for this tab so a refresh doesn't lose it.
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('session_id') ?? '';
    let id = fromUrl;
    try { if (fromUrl) sessionStorage.setItem('ks.session', fromUrl); else id = sessionStorage.getItem('ks.session') ?? ''; } catch { /* storage blocked */ }
    setSessionId(id);
    if (!id) { setGate('unpaid'); return; }
    let tries = 0;
    let stop = false;
    const check = async () => {
      try {
        const r = (await (await fetch(`${base}/api/keystones?session_id=${encodeURIComponent(id)}`, { cache: 'no-store' })).json()) as { paid?: boolean; buildsLeft?: number; code?: string | null };
        if (stop) return;
        if (r.paid) { setGate('paid'); setBuildsLeft(r.buildsLeft ?? 0); setCode(r.code ?? null); return; }
      } catch { /* try again */ }
      tries += 1;
      if (tries > 20) { setGate('unpaid'); return; }
      setGate('pending');
      setTimeout(check, 2000);
    };
    void check();
    return () => { stop = true; };
  }, [base]);

  // Answers typed here stay on this device, so a rebuild doesn't start from scratch.
  useEffect(() => { try { const saved = localStorage.getItem('ks.intake.v1'); if (saved) setI({ ...blank(), ...(JSON.parse(saved) as Intake) }); } catch { /* none saved */ } }, []);
  useEffect(() => { try { if (I.agency_name) localStorage.setItem('ks.intake.v1', JSON.stringify(I)); } catch { /* storage full */ } }, [I]);
  useEffect(() => { if (error) errorRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, [error]);

  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('prefill') === 'sample') {
      const s = SAMPLE as unknown as Intake;
      setI({ ...blank(), ...s, agency_name: '', first_project: { ...s.first_project, client: '' } });
    }
  }, []);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [step]);

  const carried = useMemo(() => {
    if (!ready) return [];
    const fromCheckout = session.optionIds.some(Boolean) ? null : decodeProof(code);
    return QUESTIONS.map((q, i) => {
      const id = fromCheckout ? fromCheckout.answers.optionIds[i] : session.optionIds[i];
      const choice = q.choices.find((c) => c.id === id);
      return { q, id, choice };
    });
  }, [ready, session, code]);
  const answered = carried.filter((c) => c.choice);
  const proofDone = answered.length === QUESTIONS.length;

  const set = <K extends keyof Intake>(k: K, v: Intake[K]) => setI((p) => ({ ...p, [k]: v }));
  const deptNames = I.departments.map((d) => d.name);
  const roleOptions = Array.from(new Set([...I.departments.map((d) => d.lead).filter(Boolean), 'Client marketing lead']));

  const dateIssues = firstProjectProblems(I.first_project);
  const problems: Record<number, string> = {
    0: I.agency_name.trim() ? '' : "The agency's name is needed to build the pack.",
    1: I.departments.length ? '' : 'Pick at least one department.',
    2: I.rounds.length && I.rounds.every((r) => r.name.trim()) ? '' : 'Every round needs a name.',
    5: Object.values(dateIssues)[0] ?? '',
  };

  function setDepts(names: string[]) {
    const next = names.map((n) => I.departments.find((d) => d.name === n) ?? { name: n, lead: DEPTS.find(([x]) => x === n)?.[1] ?? `${n} lead`, roles: [] });
    setI((p) => {
      const keep = p.handoffs.filter((h) => names.includes(h.from) && names.includes(h.to));
      const add = defaultHandoffs(names).filter((h) => !keep.some((k) => k.from === h.from && k.to === h.to));
      return { ...p, departments: next, handoffs: [...keep, ...add] };
    });
  }

  function setRound(i: number, patch: Partial<Round>) {
    set('rounds', I.rounds.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }

  async function build() {
    if (problems[5]) { setError(problems[5]); return; }
    setBusy(true); setError('');
    const proof = { answers: Object.fromEntries(carried.filter((c) => c.id).map((c) => [c.q.id, c.id as string])) };
    const lead = (n: string) => I.departments.find((d) => d.name === n)?.lead;
    const intake = {
      ...I,
      rounds: I.rounds.map((r, i) => ({ ...r, id: `R${i + 1}` })),
      record_owner: I.record_owner || lead('Account') || I.departments[0]?.lead || 'Account lead',
      rights_owner: I.rights_owner || lead('Business Affairs') || lead('Legal') || 'Business Affairs',
      handoffs: I.handoffs.map((h) => ({ ...h, items: h.items.map((l) => l.trim()).filter(Boolean) })).filter((h) => h.items.length),
      first_project: I.first_project.client && I.first_project.project ? I.first_project : undefined,
    };
    try {
      const res = await fetch(`${base}/api/keystones`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session_id: sessionId, intake, proof }),
      });
      const out = (await res.json().catch(() => ({}))) as { error?: string; url?: string; name?: string; size?: number; buildsLeft?: number; emailed?: boolean };
      if (!res.ok || !out.url) { setError(out.error ?? "The pack couldn't be built."); return; }
      setFile({ url: out.url, name: out.name ?? 'context-keystones.zip', size: out.size ?? 0, emailed: !!out.emailed });
      setBuildsLeft(out.buildsLeft ?? 0);
      setStep(6);
    } catch {
      setError("The pack couldn't be built. Check the connection and try again.");
    } finally { setBusy(false); }
  }

  const next = () => (problems[step] ? setError(problems[step]) : (setError(''), setStep(step + 1)));

  return (
    <article className="ks">
      <header className="ks-head">
        <p className="ks-kicker">Context Keystones · after the PROOF</p>
        <h1>{STEPS[step]}</h1>
        <ol className="ks-progress" aria-label="Steps">
          {STEPS.map((s, i) => <li key={s} className={i === step ? 'now' : i < step ? 'done' : ''} aria-current={i === step ? 'step' : undefined}><span>{s}</span></li>)}
        </ol>
      </header>

      {gate !== 'paid' ? (
        <section className="ks-step" aria-live="polite">
          {gate === 'checking' || gate === 'pending' ? (
            <div className="ks-card"><h2>Confirming the checkout</h2><p>This takes a few seconds after payment.</p></div>
          ) : (
            <div className="ks-card">
              <h2>Built after checkout</h2>
              <p>Context Keystones are the folders, markdown files, scripts and protocols an agency&apos;s work runs on, each tailored to its own roles, rounds and clients.</p>
              <p>{answered.length ? `${answered.length} PROOF answers on this device carry over to checkout and into the pack.` : 'Take the PROOF first and its answers carry over into the pack.'}</p>
              <a className="px-btn px-btn-light ks-download" href={checkoutHref(ready ? encodeProof('agency', { values: session.values, optionIds: session.optionIds }) : null)}>Check out and build</a>
              <p className="ks-hint"><KeystonesPrice offer={offer} /> Up to 5 builds per purchase. {answered.length ? '' : <Link href="/">Take the PROOF first.</Link>}</p>
              {sessionId ? <p className="ks-hint">This checkout couldn&apos;t be confirmed. Reply to the receipt email and it&apos;ll be sorted out.</p> : null}
            </div>
          )}
        </section>
      ) : null}

      {gate === 'paid' && step === 0 && (
        <section className="ks-step">
          <div className="ks-card">
            <h2>Carried over from the PROOF</h2>
            {!ready ? <p>Loading the PROOF answers.</p> : answered.length === 0 ? (
              <p>No PROOF answers on this device yet. <Link href="/">Take the PROOF first</Link> and they&apos;ll carry over here, or keep going without them.</p>
            ) : (
              <>
                <p className="ks-hint">{answered.length} of {QUESTIONS.length} answers carry over and won&apos;t be asked again.{proofDone ? '' : ' The rest can be finished in the PROOF.'}</p>
                <details className="ks-carried">
                  <summary>See the carried answers</summary>
                  <ul>{answered.map((c) => <li key={c.q.id}><span>{c.q.text}</span><strong>{c.choice!.text}</strong></li>)}</ul>
                </details>
              </>
            )}
          </div>
          <Text label="What's the agency called?" value={I.agency_name} onChange={(v) => set('agency_name', v)} placeholder="Agency name" />
        </section>
      )}

      {gate === 'paid' && step === 1 && (
        <section className="ks-step">
          <Chips label="Which departments work on a typical project?" options={DEPTS.map(([d]) => d)} value={deptNames} onChange={setDepts} />
          {I.departments.length > 0 && (
            <fieldset className="ks-field">
              <legend>What&apos;s the lead role in each one?</legend>
              {I.departments.map((d, i) => (
                <label key={d.name} className="ks-inline"><span>{d.name}</span>
                  <input value={d.lead} onChange={(e) => set('departments', I.departments.map((x, j) => (j === i ? { ...x, lead: e.target.value } : x)))} />
                </label>
              ))}
            </fieldset>
          )}
        </section>
      )}

      {gate === 'paid' && step === 2 && (
        <section className="ks-step">
          <Chips label="Which stages does a project move through?" hint="In order. Rename by adding the team's own name and turning the default off." options={STAGES} value={I.stages} onChange={(v) => set('stages', v)} />
          <fieldset className="ks-field">
            <legend>Review rounds, in order</legend>
            <p className="ks-hint">Name each round, then mark who reviews it, whether Business Affairs or legal joins, and whether the client sees it.</p>
            {I.rounds.map((r, i) => (
              <div className="ks-round" key={i}>
                <div className="ks-round-top">
                  <span className="ks-rid">R{i + 1}</span>
                  <input aria-label={`Round ${i + 1} name`} value={r.name} onChange={(e) => setRound(i, { name: e.target.value })} />
                  <button type="button" className="ks-ghost" aria-label={`Remove round ${i + 1}`} onClick={() => set('rounds', I.rounds.filter((_, j) => j !== i))}>Remove</button>
                </div>
                <div className="ks-chips">
                  {Array.from(new Set([...roleOptions, ...r.reviewers])).map((o) => (
                    <button type="button" key={o} className={`ks-chip sm${r.reviewers.includes(o) ? ' on' : ''}`} aria-pressed={r.reviewers.includes(o)} onClick={() => setRound(i, { reviewers: toggle(r.reviewers, o) })}>{o}</button>
                  ))}
                </div>
                <div className="ks-toggles">
                  <label><input type="checkbox" checked={r.business_affairs} onChange={(e) => setRound(i, { business_affairs: e.target.checked })} /> Business Affairs or legal joins</label>
                  <label><input type="checkbox" checked={r.client_sees} onChange={(e) => setRound(i, { client_sees: e.target.checked })} /> The client sees it</label>
                </div>
              </div>
            ))}
            <button type="button" className="ks-ghost wide" onClick={() => set('rounds', [...I.rounds, { id: '', name: '', reviewers: [], business_affairs: false, client_sees: false, purpose: '' }])}>Add a round</button>
          </fieldset>
        </section>
      )}

      {gate === 'paid' && step === 3 && (
        <section className="ks-step">
          <Chips label="What does the agency deliver most often?" options={DELIVERABLES} value={I.deliverables} onChange={(v) => set('deliverables', v)} />
          <Chips label="Which client mandatories come up again and again?" options={MANDATORIES} value={I.mandatory_types} onChange={(v) => set('mandatory_types', v)} />
          <Chips label="Which legal lines show up in the work?" options={LEGAL} value={I.legal_line_types} onChange={(v) => set('legal_line_types', v)} />
          <Chips label="What gets licensed or cleared most often?" options={RIGHTS} value={I.rights_types} onChange={(v) => set('rights_types', v)} />
          <Chips label="Where do campaigns usually run?" options={MEDIA} value={I.usual_media} onChange={(v) => set('usual_media', v)} />
          <Chips label="In which countries or regions?" options={['US', 'Canada', 'UK', 'EU', 'Latin America', 'Worldwide']} value={I.usual_territories} onChange={(v) => set('usual_territories', v)} />
        </section>
      )}

      {gate === 'paid' && step === 4 && (
        <section className="ks-step">
          <Radio label="Where are project files kept today?" options={STORAGE} value={I.storage} onChange={(v) => set('storage', v)} />
          <Chips label="How are changes announced to the team today?" options={CHANNELS} value={I.change_channels} onChange={(v) => set('change_channels', v)} />
          <Radio label="How are versions named?" options={VERSIONS} value={I.version_style} onChange={(v) => set('version_style', v)} />
          <fieldset className="ks-field">
            <legend>When work moves between departments, what has to go with it that sometimes doesn&apos;t?</legend>
            <p className="ks-hint">One item per line. Leave a handoff blank to use the standard list.</p>
            {I.handoffs.map((h, i) => (
              <label key={`${h.from}-${h.to}`} className="ks-area"><span>{h.from} to {h.to}</span>
                <textarea rows={3} value={h.items.join('\n')} onChange={(e) => set('handoffs', I.handoffs.map((x, j) => (j === i ? { ...x, items: e.target.value.split('\n') } : x)))} />
              </label>
            ))}
            {I.handoffs.length === 0 ? <p className="ks-hint">Handoffs appear here once two connected departments are picked.</p> : null}
          </fieldset>
        </section>
      )}

      {gate === 'paid' && step === 5 && (
        <section className="ks-step">
          <p className="ks-hint">Optional. With these filled in, the pack comes with the first project already set up.</p>
          <Text label="Client" value={I.first_project.client} onChange={(v) => set('first_project', { ...I.first_project, client: v })} />
          <Text label="Project" value={I.first_project.project} onChange={(v) => set('first_project', { ...I.first_project, project: v })} />
          <Text label="Job code" value={I.first_project.code} onChange={(v) => set('first_project', { ...I.first_project, code: v })} />
          <Text label="Due date" placeholder={DATE_EXAMPLE} inputMode="numeric" hint="Year-month-day, like 2026-11-14." value={I.first_project.due}
            problem={dateIssues.due} note={isPast(I.first_project.due) ? 'That date has already passed. It will be kept as typed.' : undefined}
            onChange={(v) => set('first_project', { ...I.first_project, due: v })} />
          <div className="ks-two">
            <Text label="Flight starts" placeholder={DATE_EXAMPLE} inputMode="numeric" value={I.first_project.flight_start} problem={dateIssues.flight_start} onChange={(v) => set('first_project', { ...I.first_project, flight_start: v })} />
            <Text label="Flight ends" placeholder={DATE_EXAMPLE} inputMode="numeric" value={I.first_project.flight_end} problem={dateIssues.flight_end} onChange={(v) => set('first_project', { ...I.first_project, flight_end: v })} />
          </div>
          {I.mandatory_types.length + I.legal_line_types.length > 0 && (
            <fieldset className="ks-field">
              <legend>Current wording, if it&apos;s handy</legend>
              {I.mandatory_types.map((t) => <Text key={t} label={t} value={I.mandatory_values[t] ?? ''} onChange={(v) => set('mandatory_values', { ...I.mandatory_values, [t]: v })} />)}
              {I.legal_line_types.map((t) => <Text key={t} label={t} value={I.legal_values[t] ?? ''} onChange={(v) => set('legal_values', { ...I.legal_values, [t]: v })} />)}
            </fieldset>
          )}
        </section>
      )}

      {step === 6 && file && (
        <section className="ks-step">
          <div className="ks-card ks-done">
            <h2>The pack is ready</h2>
            <p>Built for {I.agency_name} from {answered.length} PROOF answers and this intake.</p>
            <a className="px-btn px-btn-light ks-download" href={file.url} download={file.name}>Download {file.name} ({Math.round(file.size / 1024)} KB)</a>
            <p className="ks-hint">{file.emailed ? 'The same link is on its way to the checkout email. ' : ''}The link works for 24 hours. {buildsLeft} {buildsLeft === 1 ? 'build' : 'builds'} left for this purchase.</p>
          </div>
          <div className="ks-card">
            <h2>What&apos;s inside</h2>
            <ul className="ks-list">
              <li><strong>Folders</strong> built on {I.stages.length} stages, {I.rounds.length} review rounds and {I.deliverables.length || 'the'} deliverable types.</li>
              <li><strong>Markdowns</strong> for the brief, mandatories, legal lines, rights, decisions and the change log, plus AI-CONTEXT.md.</li>
              <li><strong>Scripts</strong> that keep versions, mandatories and rights current, with a watch mode.</li>
              <li><strong>Protocols</strong> for changes, review rounds and handoffs.</li>
            </ul>
          </div>
          <div className="ks-card">
            <h2>First steps</h2>
            <ol className="ks-list">
              <li>Unzip it into the folder where project files live.</li>
              <li>Open START HERE.md.</li>
              <li>Double-click the launch file for the computer in use and pick 1 to start a project.</li>
            </ol>
          </div>
        </section>
      )}

      {error ? <p className="ks-error" role="alert" ref={errorRef}>{error}</p> : null}

      {gate === 'paid' && step < 6 && (
        <nav className="ks-nav">
          {step > 0 ? <button type="button" className="ks-ghost" onClick={() => { setError(''); setStep(step - 1); }}>Back</button> : <span />}
          {step < 5 ? <button type="button" className="px-btn px-btn-light" onClick={next}>Next</button>
            : <button type="button" className="px-btn px-btn-light" disabled={busy} onClick={build}>{busy ? 'Building the pack' : 'Build the pack'}</button>}
        </nav>
      )}
      {step === 6 && buildsLeft > 0 ? <nav className="ks-nav ks-nav-static"><button type="button" className="ks-ghost" onClick={() => setStep(5)}>Change an answer</button><span /></nav> : null}
    </article>
  );
}
