'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from './SessionProvider';
import { trace } from '../lib/diagnostics';
import { formatHours, formatPressure, formatWait, reviewDate } from '../lib/format';
import { BAND_COPY } from '../lib/operational';
import { buildRecord } from '../lib/record';
import { getDepartment } from '../lib/departments';

export function RecordExperience() {
  const { session } = useSession();
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    setToday(new Date());
    trace('record', 'state', { event: 'record-open', department: session.departmentId });
  }, [session.departmentId]);

  const department = getDepartment(session.departmentId);
  const reviewedOn = today ? today.toISOString().slice(0, 10) : 'today';
  const record = buildRecord({
    answers: { values: session.values, optionIds: session.optionIds },
    teamSize: session.teamSize,
    departmentId: session.departmentId,
    evidenceKind: session.evidenceKind,
    inputs: session.inputs,
    modifierOn: session.modifierOn,
    reviewedOn,
  });
  const due = today ? reviewDate(today, department.action.reviewInDays) : null;

  const download = () => {
    const blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `visualizer-${department.id.toLowerCase()}-${reviewedOn}.json`;
    link.click();
    URL.revokeObjectURL(url);
    trace('record', 'interaction', { event: 'export', department: department.id });
  };

  const baseline = record.scenario.baseline;

  return (
    <article className="record">
      <p className="kicker">Portable record · {record.model.operational}</p>
      <h1>
        {department.workItem} in {department.name}
      </h1>
      <p className="lede">{department.gap}</p>
      <p className="note">
        Evidence is marked <strong>{session.evidenceKind}</strong>. A simulated or estimated figure
        is not an observation.
      </p>

      <section>
        <h2>The repair</h2>
        <p>
          {department.repairRole} absorbs it: {department.repair}
        </p>
        <p className={`band-word band-${baseline.band}`}>
          <span>{baseline.band}</span>
          {BAND_COPY[baseline.band]}
        </p>
        <dl className="record-stats">
          <div>
            <dt>Repair hours</dt>
            <dd>{formatHours(baseline.repairHours)}</dd>
          </div>
          <div>
            <dt>Required hours</dt>
            <dd>{formatHours(baseline.requiredHours)}</dd>
          </div>
          <div>
            <dt>Available hours</dt>
            <dd>{formatHours(session.inputs.availableHours)}</dd>
          </div>
          <div>
            <dt>Pressure</dt>
            <dd>{formatPressure(baseline.pressure)}</dd>
          </div>
          <div>
            <dt>Modeled wait</dt>
            <dd>
              {baseline.queueState === 'no-steady-state'
                ? 'No steady wait'
                : formatWait(baseline.waitHours)}
            </dd>
          </div>
          <div>
            <dt>Net hours after the change</dt>
            <dd>{formatHours(record.scenario.netReleasedHours)}</dd>
          </div>
        </dl>
      </section>

      {record.map ? (
        <section>
          <h2>Map reading</h2>
          <p>
            {record.map.profile}. {record.map.profileStatement} Raw score {record.map.rawScore} of
            30, answer index {record.map.answerIndex}. Preset range{' '}
            {record.map.presetHoursPerWeek?.low}–{record.map.presetHoursPerWeek?.high} hours per
            week for {record.map.teamSize} {record.map.teamSize === 1 ? 'person' : 'people'}.
          </p>
          <p className="note">{record.map.note}</p>
          <ul>
            {record.map.pressures.map((pressure) => (
              <li key={pressure.id}>
                <code>{pressure.id}</code> {pressure.label}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section>
          <h2>Map reading</h2>
          <p>The Map is unfinished, so this record does not invent a score.</p>
          <Link href="/map">Finish the Map</Link>
        </section>
      )}

      <section>
        <h2>The change</h2>
        <p>{department.action.change}</p>
        <p>
          Owner role: {department.action.ownerRole}. Bring back: {department.action.evidence} Review
          date: {due ?? `in ${department.action.reviewInDays} days`}.
        </p>
      </section>

      <section>
        <h2>Assumptions</h2>
        <ul>
          {record.scenario.assumptions.map((assumption) => (
            <li key={assumption}>{assumption}</li>
          ))}
        </ul>
      </section>

      <div className="actions no-print">
        <button type="button" className="button" onClick={download}>
          Download JSON
        </button>
        <button type="button" className="button ghost" onClick={() => window.print()}>
          Print
        </button>
        <Link className="button ghost" href="/visualizer">
          Back to the workflow
        </Link>
      </div>
    </article>
  );
}
