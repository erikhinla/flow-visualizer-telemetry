'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Balance } from './Balance';
import { KeystonePath } from './KeystonePath';
import { TraceBoard } from './TraceBoard';
import { useSession } from './SessionProvider';
import { trace } from '../lib/diagnostics';
import { formatHours, formatPressure, formatWait, reviewDate } from '../lib/format';
import { BAND_COPY, BAND_WORD, balanceReason } from '../lib/operational';
import { buildRecord } from '../lib/record';
import { getDepartment } from '../lib/departments';

export function RecordExperience() {
  const { ready, session, clearSession } = useSession();
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    setToday(new Date());
  }, []);

  useEffect(() => {
    if (!ready) return;
    trace({ name: 'record-open', department: session.departmentId });
  }, [ready, session.departmentId]);

  const department = getDepartment(session.departmentId);
  const reviewedOn = today ? today.toISOString().slice(0, 10) : 'today';
  const record = buildRecord({
    answers: { values: session.values, optionIds: session.optionIds },
    teamSize: session.teamSize,
    departmentId: session.departmentId,
    evidenceKind: session.evidenceKind,
    attested: session.attested,
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
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    trace({ name: 'record-export', department: department.id });
  };

  if (!ready) {
    return <p className="note">Opening the record…</p>;
  }

  const baseline = record.scenario.baseline;

  return (
    <article className="record">
      <p className="kicker">{department.name} · the record to take away</p>
      <h1>{department.mirror}</h1>
      {department.relief ? <p className="benefit">{department.relief}</p> : null}
      <p className="note">{record.provenance.sentence}</p>

      <TraceBoard
        departmentId={department.id}
        band={baseline.band}
        repairHours={baseline.repairHours}
        known={baseline.known}
        evidenceKind={record.provenance.kind}
      />
      <KeystonePath
        departmentId={department.id}
        band={baseline.band}
        repairHours={baseline.repairHours}
        known={baseline.known}
        evidenceKind={record.provenance.kind}
      />

      <section>
        <h2>Hours spent searching</h2>
        <p>
          {department.repairRole} is losing these hours to the search. The craft, the review by the client,
          and the judgment aren't part of that count.
        </p>
        <p className={`band-word band-${baseline.band}`}>
          <span>{BAND_WORD[baseline.band]}</span>
          {BAND_COPY[baseline.band]}
        </p>
        <dl className="record-stats">
          <div>
            <dt>Hours searching</dt>
            <dd>{formatHours(baseline.repairHours)}</dd>
          </div>
          <div>
            <dt>Total hours required</dt>
            <dd>{formatHours(baseline.requiredHours)}</dd>
          </div>
          <div>
            <dt>Team hours</dt>
            <dd>{formatHours(session.inputs.availableHours)}</dd>
          </div>
          <div>
            <dt>How full</dt>
            <dd>{formatPressure(baseline.pressure)}</dd>
          </div>
          <div>
            <dt>Waiting</dt>
            <dd>
              {baseline.queueState === 'no-steady-state'
                ? 'No steady wait'
                : formatWait(baseline.waitHours)}
            </dd>
          </div>
          <div>
            <dt>Hours back after the change</dt>
            <dd>{formatHours(record.scenario.netReleasedHours)}</dd>
          </div>
        </dl>
      </section>

      {record.map ? (
        <section>
          <h2>Scan</h2>
          <p>
            {record.map.profile}. {record.map.profileStatement} Raw score {record.map.rawScore} of
            30, answer index {record.map.answerIndex}. Preset range{' '}
            {record.map.presetHoursPerWeek?.low} to {record.map.presetHoursPerWeek?.high} hours per
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
          <h2>Scan</h2>
          <p>The scan is unfinished, so this record doesn't invent a score.</p>
          <Link href="/map">Finish the scan</Link>
        </section>
      )}

      <Balance
        departmentId={department.id}
        change={department.action.change}
        comesBack={record.scenario.repairDeltaHours}
        ongoing={session.inputs.ongoingHours}
        net={record.scenario.netReleasedHours}
        pressureWithOngoing={record.scenario.pressureWithOngoing}
        reason={balanceReason({
          baselineKnown: record.scenario.baseline.known,
          changedKnown: record.scenario.changed.known,
          ongoingHours: session.inputs.ongoingHours,
          net: record.scenario.netReleasedHours,
        })}
      />

      <section>
        <h2>Owner and review</h2>
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
          Back to the department
        </Link>
        <button type="button" className="button ghost" onClick={clearSession}>
          Clear this browser
        </button>
      </div>
    </article>
  );
}
