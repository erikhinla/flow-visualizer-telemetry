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
import { DEPARTMENTS, getDepartment } from '../lib/departments';
import { trace } from '../lib/diagnostics';
import { manifestation } from '../lib/manifestation';
import { compareScenario } from '../lib/operational';
import { isComplete, scoreMap, suggestDepartment } from '../lib/questionnaire';
import type { EvidenceKind } from '../lib/types';
import { MANIFESTATION_MODEL_VERSION, OPERATIONAL_MODEL_VERSION } from '../lib/types';

const EVIDENCE: Array<{ id: EvidenceKind; label: string }> = [
  { id: 'simulated', label: 'Simulated sample' },
  { id: 'estimated', label: 'Estimated' },
  { id: 'self-reported', label: 'Self-reported' },
  { id: 'observed', label: 'Observed' },
];

export function VisualizerExperience() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, session, setSession, selectDepartment, editInputs } = useSession();
  const applied = useRef(false);
  const [showChange, setShowChange] = useState(true);

  useEffect(() => {
    if (!ready || applied.current) return;
    if (searchParams.get('from') !== 'map') return;
    applied.current = true;
    const score = scoreMap({ values: session.values, optionIds: session.optionIds });
    if (score) selectDepartment(suggestDepartment(score.pressures));
    router.replace('/visualizer');
  }, [ready, router, searchParams, selectDepartment, session.optionIds, session.values]);

  const department = getDepartment(session.departmentId);
  const comparison = compareScenario(session.inputs);
  const variability = session.inputs.variability ?? 1;
  const mapReady = isComplete({ values: session.values, optionIds: session.optionIds });
  const index = mapReady
    ? manifestation({
        answers: session.values as Array<0 | 1 | 2>,
        departmentId: session.departmentId,
        modifierOn: session.modifierOn,
      })
    : null;

  return (
    <article className="see">
      <header className="see-intro">
        <p className="kicker">
          {department.id} · {department.moniker}
        </p>
        <h1>{department.gap}</h1>
        <p className="lede">
          {department.repairRole} absorbs it: {department.repair} The connection to test is{' '}
          {department.connection} Necessary review is not reconstruction.
        </p>
        {department.campaignLine ? <p className="campaign">{department.campaignLine}</p> : null}
      </header>

      <div className="dept-rail" role="group" aria-label="Departments">
        {DEPARTMENTS.map((item) => {
          const selected = item.id === department.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected}
              className={selected ? 'dept selected' : 'dept'}
              onClick={() => {
                if (item.id === department.id) return;
                selectDepartment(item.id);
                trace('visualizer', 'interaction', { department: item.id });
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
        evidenceKind={session.evidenceKind}
      />
      <KeystonePath
        departmentId={department.id}
        band={comparison.baseline.band}
        repairHours={comparison.baseline.repairHours}
        known={comparison.baseline.known}
        evidenceKind={session.evidenceKind}
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
          <label className="evidence">
            Evidence
            <select
              value={session.evidenceKind}
              onChange={(event) =>
                setSession((current) => ({
                  ...current,
                  evidenceKind: event.target.value as EvidenceKind,
                }))
              }
            >
              {EVIDENCE.map((kind) => (
                <option key={kind.id} value={kind.id}>
                  {kind.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="note">
          Blank means unknown. Unknown is not zero. Editing a sample marks the evidence as estimated
          until you say otherwise.
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
            label="Missing the connection"
            value={session.inputs.missingShare}
            onChange={(missingShare) => editInputs({ missingShare })}
          />
          <NumberField
            id="minutes"
            label="Minutes to reconstruct one"
            suffix="min"
            value={session.inputs.repairMinutes}
            onChange={(repairMinutes) => editInputs({ repairMinutes })}
          />
          <NumberField
            id="necessary"
            label="Craft and required review"
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
            Compare one changed connection
          </label>
          {showChange ? (
            <div className="fields">
              <PercentField
                id="next-share"
                label="Missing share after the change"
                value={session.inputs.nextMissingShare}
                onChange={(nextMissingShare) => editInputs({ nextMissingShare })}
              />
              <NumberField
                id="next-minutes"
                label="Minutes to reconstruct after"
                suffix="min"
                value={session.inputs.nextRepairMinutes}
                onChange={(nextRepairMinutes) => editInputs({ nextRepairMinutes })}
              />
              <NumberField
                id="ongoing"
                label="Hours to keep the connection"
                suffix="h"
                value={session.inputs.ongoingHours}
                onChange={(ongoingHours) => editInputs({ ongoingHours })}
              />
            </div>
          ) : null}
        </div>
        <button
          type="button"
          className="button ghost"
          onClick={() => selectDepartment(department.id)}
        >
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
      />

      <section className="action-card">
        <p className="kicker">Who carries it</p>
        <h2>Same workflow. Same period. Review stays.</h2>
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
          forming from 0.70, closing from 0.90, seized at 1. The curve is continuous. Necessary
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
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <span className="field-box">
        <input
          id={id}
          inputMode="decimal"
          value={value ?? ''}
          onChange={(event) => onChange(readNumber(event.target.value))}
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
  const shown = value === null ? '' : String(Math.round(value * 1000) / 10);
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <span className="field-box">
        <input
          id={id}
          inputMode="decimal"
          value={shown}
          onChange={(event) => {
            const next = readNumber(event.target.value);
            onChange(next === null ? null : next / 100);
          }}
        />
        <span>%</span>
      </span>
    </label>
  );
}

function readNumber(raw: string): number | null {
  if (raw.trim() === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}
