'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Balance } from './Balance';
import { DepartmentMark } from './DepartmentMark';
import { FlowTrack } from './FlowTrack';
import { KeystonePath } from './KeystonePath';
import { Readout } from './Readout';
import { SeizureCurve } from './SeizureCurve';
import { TraceBoard } from './TraceBoard';
import { useSession } from './SessionProvider';
import { DEPARTMENTS, getDepartment, isDepartmentId } from '../lib/departments';
import { trace } from '../lib/diagnostics';
import { presentedEvidence } from '../lib/evidence';
import { commitNumeric } from '../lib/format';
import { manifestation } from '../lib/manifestation';
import { balanceReason, compareScenario, scenarioDirty } from '../lib/operational';
import { isComplete, scoreMap, suggestDepartment } from '../lib/questionnaire';
import { isUntouchedSession } from '../lib/session';
import type { DepartmentId, EvidenceKind } from '../lib/types';
import { MANIFESTATION_MODEL_VERSION, OPERATIONAL_MODEL_VERSION } from '../lib/types';

const RELEASED: EvidenceKind[] = ['estimated', 'self-reported', 'observed'];

export function VisualizerExperience() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, session, setSession, selectDepartment, editInputs } = useSession();
  const [showChange, setShowChange] = useState(true);
  const [settled, setSettled] = useState(false);
  const [bannerDesk, setBannerDesk] = useState<DepartmentId | null>(null);
  const selectedRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!ready || settled) return;
    const fromMap = searchParams.get('from') === 'map';
    const desk = searchParams.get('desk');

    if (fromMap) {
      const score = scoreMap({ values: session.values, optionIds: session.optionIds });
      if (score) selectDepartment(suggestDepartment(score.pressures));
      router.replace('/visualizer');
      setSettled(true);
      return;
    }

    if (desk === null) {
      setSettled(true);
      return;
    }

    if (!isDepartmentId(desk)) {
      router.replace('/visualizer');
      setSettled(true);
      return;
    }

    if (desk === session.departmentId) {
      router.replace('/visualizer');
      setSettled(true);
      return;
    }

    if (isUntouchedSession(session)) {
      selectDepartment(desk);
      router.replace('/visualizer');
      setSettled(true);
      return;
    }

    setBannerDesk(desk);
    setSettled(true);
  }, [ready, settled, router, searchParams, selectDepartment, session]);

  useEffect(() => {
    if (!settled) return;
    selectedRef.current?.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  }, [settled, session.departmentId]);

  const department = getDepartment(session.departmentId);
  const comparison = compareScenario(session.inputs);
  const variability = session.inputs.variability ?? 1;
  const dirty = scenarioDirty(session.inputs, department.sample);
  const presentation = presentedEvidence({
    evidenceKind: session.evidenceKind,
    attested: session.attested,
    dirty,
    known: comparison.baseline.known,
  });
  const mapReady = isComplete({ values: session.values, optionIds: session.optionIds });
  const index = mapReady
    ? manifestation({
        answers: session.values as Array<0 | 1 | 2>,
        departmentId: session.departmentId,
        modifierOn: session.modifierOn,
      })
    : null;
  const reason = balanceReason({
    compareOff: !showChange,
    baselineKnown: comparison.baseline.known,
    changedKnown: comparison.changed.known,
    ongoingHours: session.inputs.ongoingHours,
    net: comparison.netReleasedHours,
  });

  const replaceDesk = (id: DepartmentId) => {
    if (dirty && !window.confirm('Replace this desk? The numbers you edited will be replaced by that sample.')) {
      return;
    }
    selectDepartment(id);
    trace({ name: 'desk-open', department: id });
  };

  if (!ready || !settled) {
    return <p className="note">Opening the Trace…</p>;
  }

  const bannerName = bannerDesk ? getDepartment(bannerDesk).name : '';

  return (
    <article className="see">
      <header className="see-intro">
        <p className="kicker">{department.name} · sample until you replace the numbers</p>
        <h1>{department.mirror}</h1>
        <p className="benefit">{department.relief}</p>
        {department.campaignLine ? <p className="campaign">{department.campaignLine}</p> : null}
      </header>

      {bannerDesk ? (
        <div className="desk-banner" role="status">
          <p>
            This link opens the {bannerName} sample. This Trace is still {department.name}.
          </p>
          <div className="actions">
            <button
              type="button"
              className="button"
              onClick={() => {
                if (
                  dirty &&
                  !window.confirm(
                    'Replace this desk? The numbers you edited will be replaced by that sample.'
                  )
                ) {
                  return;
                }
                selectDepartment(bannerDesk);
                trace({ name: 'desk-open', department: bannerDesk });
                setBannerDesk(null);
                router.replace('/visualizer');
              }}
            >
              Open the {bannerName} sample
            </button>
            <button
              type="button"
              className="button ghost"
              onClick={() => {
                setBannerDesk(null);
                router.replace('/visualizer');
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      <div className="dept-rail" role="group" aria-label="Departments">
        {DEPARTMENTS.map((item) => {
          const selected = item.id === department.id;
          return (
            <button
              key={item.id}
              ref={selected ? selectedRef : undefined}
              type="button"
              aria-pressed={selected}
              className={selected ? 'dept selected' : 'dept'}
              onClick={() => {
                if (item.id === department.id) return;
                replaceDesk(item.id);
              }}
            >
              <DepartmentMark id={item.id} accent={item.accent} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </div>

      <TraceBoard
        departmentId={department.id}
        band={comparison.baseline.band}
        repairHours={comparison.baseline.repairHours}
        known={comparison.baseline.known}
        evidenceKind={presentation.kind}
      />
      <KeystonePath
        departmentId={department.id}
        band={comparison.baseline.band}
        repairHours={comparison.baseline.repairHours}
        known={comparison.baseline.known}
        evidenceKind={presentation.kind}
      />

      <FlowTrack
        stages={department.stages}
        band={comparison.baseline.band}
        accent={department.accent}
      />

      <div className="see-grid">
        <Readout
          baseline={comparison.baseline}
          changed={showChange ? comparison.changed : null}
          availableHours={session.inputs.availableHours}
          repairDelta={showChange ? comparison.repairDeltaHours : null}
          netReleased={showChange ? comparison.netReleasedHours : null}
          pressureWithOngoing={showChange ? comparison.pressureWithOngoing : null}
        />
        <SeizureCurve
          rho={comparison.baseline.pressure}
          compareRho={showChange ? comparison.changed.pressure : null}
          variability={variability}
          accent={department.accent}
        />
      </div>

      <section className="scenario">
        <div className="scenario-head">
          <h2>
            {department.workItem} · one {department.period}
          </h2>
          <EvidenceControl
            locked={presentation.locked}
            sentence={presentation.sentence}
            kind={session.evidenceKind}
            attested={session.attested}
            onKind={(evidenceKind) =>
              setSession((current) => ({ ...current, evidenceKind, attested: false }))
            }
            onAttest={(attested) =>
              setSession((current) =>
                attested
                  ? { ...current, attested: true }
                  : { ...current, attested: false, evidenceKind: 'estimated' }
              )
            }
          />
        </div>
        <p className="note">
          Blank means unknown. Unknown is not zero. A sample stays simulated until the numbers
          change. Observed and self-reported stay estimated until you attest them, and the next edit
          clears that claim.
        </p>
        <div className="fields">
          <NumberField
            id="items"
            label="Items in the period"
            suffix="items"
            value={session.inputs.itemCount}
            onChange={(itemCount) => editInputs({ itemCount })}
          />
          <PercentField
            id="share"
            label="Share still being searched for"
            value={session.inputs.missingShare}
            onChange={(missingShare) => editInputs({ missingShare })}
          />
          <NumberField
            id="minutes"
            label="Minutes to find one"
            suffix="min"
            value={session.inputs.repairMinutes}
            onChange={(repairMinutes) => editInputs({ repairMinutes })}
          />
          <NumberField
            id="necessary"
            label="Hours that are the real work"
            suffix="h"
            value={session.inputs.necessaryHours}
            onChange={(necessaryHours) => editInputs({ necessaryHours })}
          />
          <NumberField
            id="other"
            label="Other hours"
            suffix="h"
            value={session.inputs.otherHours}
            onChange={(otherHours) => editInputs({ otherHours })}
          />
          <NumberField
            id="available"
            label="Desk hours available"
            suffix="h"
            value={session.inputs.availableHours}
            onChange={(availableHours) => editInputs({ availableHours })}
          />
        </div>

        <div className="change-block">
          <label className="toggle">
            <input
              type="checkbox"
              checked={showChange}
              onChange={(event) => setShowChange(event.target.checked)}
            />
            Compare the week after the fix
          </label>
          {showChange ? (
            <div className="fields">
              <PercentField
                id="next-share"
                label="Share still missing after the fix"
                value={session.inputs.nextMissingShare}
                onChange={(nextMissingShare) => editInputs({ nextMissingShare })}
              />
              <NumberField
                id="next-minutes"
                label="Minutes to find one after"
                suffix="min"
                value={session.inputs.nextRepairMinutes}
                onChange={(nextRepairMinutes) => editInputs({ nextRepairMinutes })}
              />
              <NumberField
                id="ongoing"
                label="Hours to keep the fix"
                suffix="h"
                value={session.inputs.ongoingHours}
                onChange={(ongoingHours) => editInputs({ ongoingHours })}
              />
            </div>
          ) : null}
          {showChange && comparison.changed.issues.length > 0 ? (
            <ul className="issues">
              {comparison.changed.issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          ) : null}
        </div>
        <button type="button" className="button ghost" onClick={() => selectDepartment(department.id)}>
          Reset this desk’s sample
        </button>
      </section>

      <Balance
        departmentId={department.id}
        change={department.action.change}
        comesBack={showChange ? comparison.repairDeltaHours : null}
        ongoing={showChange ? session.inputs.ongoingHours : null}
        net={showChange ? comparison.netReleasedHours : null}
        pressureWithOngoing={showChange ? comparison.pressureWithOngoing : null}
        reason={reason}
      />

      <section className="action-card">
        <p className="kicker">Who carries it</p>
        <h2>Your people still do the work. The judgment stays.</h2>
        <dl>
          <div>
            <dt>Owner role</dt>
            <dd>{department.action.ownerRole}</dd>
          </div>
          <div>
            <dt>What to compare</dt>
            <dd>{department.compare}</dd>
          </div>
          <div>
            <dt>Evidence to bring back</dt>
            <dd>{department.action.evidence}</dd>
          </div>
          <div>
            <dt>Review</dt>
            <dd>In {department.action.reviewInDays} days, on this same workflow.</dd>
          </div>
        </dl>
        <Link className="button" href="/record">
          Take the record
        </Link>
      </section>

      <details className="inspector">
        <summary>Calculation inspector · {OPERATIONAL_MODEL_VERSION}</summary>
        <p>
          Repair hours = items × missing share × minutes ÷ 60. Required hours = necessary + repair +
          other. Pressure = required ÷ available role-hours. Margin = available − required.
        </p>
        <p>
          Waiting uses Kingman’s approximation for one role: variability × (pressure ÷ (1 −
          pressure)) × mean handling time. Arrivals are assumed to spread across the available
          hours. Variability of 1 matches exponential arrivals and service. It is not measured here.
          At pressure of 1 or more, the model has no finite steady wait.
        </p>
        <label className="field" htmlFor="variability">
          <span>Variability assumption</span>
          <span className="field-box">
            <input
              id="variability"
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={session.inputs.variability ?? 1}
              onChange={(event) => editInputs({ variability: Number(event.target.value) })}
            />
            <span>{variability.toFixed(1)}</span>
          </span>
        </label>
        <p>
          Display bands, not a certification: fog while repair is absorbed under 0.70 pressure,
          forming from 0.70, closing from 0.90, stalled at 1. The curve is continuous. Necessary
          review is not repair.
        </p>
        <h3>Recorded scenario index · {MANIFESTATION_MODEL_VERSION}</h3>
        <p>
          This index is the old illustration. Its exponent, weights, and modifier are uncalibrated.
          It is not repair hours and not a loss percentage. Height is an artistic 0–30 scale.
        </p>
        {index ? (
          <>
            <label className="toggle">
              <input
                type="checkbox"
                checked={session.modifierOn}
                onChange={(event) =>
                  setSession((current) => ({ ...current, modifierOn: event.target.checked }))
                }
              />
              FLOW modifier — multiplies the assumed fragility by 0.25. It does not deploy anything.
            </label>
            <p className="index-figure">
              Index {index.score.toFixed(2)} · height {index.height.toFixed(2)}
              {index.capped ? ' · display cap reached' : ''}
            </p>
          </>
        ) : (
          <p>
            Finish the scan to calculate this index. Unanswered questions are not treated as zero.
          </p>
        )}
      </details>
    </article>
  );
}

function EvidenceControl({
  locked,
  sentence,
  kind,
  attested,
  onKind,
  onAttest,
}: {
  locked: boolean;
  sentence: string;
  kind: EvidenceKind;
  attested: boolean;
  onKind: (kind: EvidenceKind) => void;
  onAttest: (attested: boolean) => void;
}) {
  const selected: EvidenceKind = RELEASED.includes(kind) ? kind : 'estimated';
  const releasable = selected === 'observed' || selected === 'self-reported';
  return (
    <div className="evidence">
      <p className="note">{sentence}</p>
      <label>
        Evidence
        <select
          value={locked ? 'simulated' : selected}
          disabled={locked}
          onChange={(event) => onKind(event.target.value as EvidenceKind)}
        >
          {locked ? <option value="simulated">Simulated sample</option> : null}
          <option value="estimated">Estimated</option>
          <option value="self-reported">Self-reported</option>
          <option value="observed">Observed</option>
        </select>
      </label>
      {releasable && !locked ? (
        <label className="toggle">
          <input
            type="checkbox"
            checked={attested}
            onChange={(event) => onAttest(event.target.checked)}
          />
          I counted these figures on a real desk. PROOF will not check them.
        </label>
      ) : null}
    </div>
  );
}

function NumberField({
  id,
  label,
  suffix,
  value,
  onChange,
}: {
  id: string;
  label: string;
  suffix: string;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft !== null ? draft : value === null ? '' : String(value);
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <span className="field-box">
        <input
          id={id}
          inputMode="decimal"
          value={shown}
          onChange={(event) => {
            const next = commitNumeric(event.target.value);
            if (next === undefined) {
              setDraft(event.target.value);
              return;
            }
            setDraft(null);
            onChange(next);
          }}
          onBlur={() => setDraft(null)}
        />
        <span>{suffix}</span>
      </span>
    </label>
  );
}

function PercentField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const canonical = value === null ? '' : String(Math.round(value * 1000) / 10);
  const shown = draft !== null ? draft : canonical;
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <span className="field-box">
        <input
          id={id}
          inputMode="decimal"
          value={shown}
          onChange={(event) => {
            const next = commitNumeric(event.target.value);
            if (next === undefined) {
              setDraft(event.target.value);
              return;
            }
            setDraft(null);
            onChange(next === null ? null : next / 100);
          }}
          onBlur={() => setDraft(null)}
        />
        <span>%</span>
      </span>
    </label>
  );
}
