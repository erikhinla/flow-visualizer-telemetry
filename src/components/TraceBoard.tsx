import { getDepartment } from '../lib/departments';
import {
  FACT_QUESTION,
  STATE_LABEL,
  STATE_LINE,
  deskTrace,
  factState,
  type FactId,
} from '../lib/trace';
import type { BandId, DepartmentId, EvidenceKind } from '../lib/types';

const FACT_ORDER: Record<FactId, string> = {
  where: '01',
  what: '02',
  who: '03',
  when: '04',
};

export function TraceBoard({
  departmentId,
  band,
  repairHours,
  known,
  evidenceKind,
}: {
  departmentId: DepartmentId;
  band: BandId;
  repairHours: number | null;
  known: boolean;
  evidenceKind: EvidenceKind;
}) {
  const department = getDepartment(departmentId);
  const trace = deskTrace(departmentId);
  const state = !known || band === 'unknown' ? 'untraced' : factState(band, repairHours);
  const line =
    band === 'unavailable' && known
      ? 'Demand is on the desk and available hours are zero. Pressure is not a finite percentage, so the four facts stay untraced.'
      : STATE_LINE[state];

  return (
    <section className="trace" aria-labelledby="trace-title" data-state={state}>
      <div className="trace-head">
        <p className="kicker">Trace · {department.name}</p>
        <h2 id="trace-title">Where. What. Who. When.</h2>
        <p className={`state-line is-${state}`}>{line}</p>
        {evidenceKind === 'simulated' ? (
          <p className="note">Simulated sample. Not a measured agency.</p>
        ) : null}
      </div>
      <div className="foundation">
        {trace.facts.map((fact) => {
          const seat =
            fact.id === 'who'
              ? department.action.ownerRole
              : fact.id === 'when'
                ? `Within ${department.action.reviewInDays} days`
                : null;
          return (
            <article key={fact.id} className={`fact is-${state}`}>
              <span className="fact-index">{FACT_ORDER[fact.id]}</span>
              <div className="fact-body">
                <h3>
                  {FACT_QUESTION[fact.id]}
                  <span className={`state-pill is-${state}`}>{STATE_LABEL[state]}</span>
                </h3>
                {state === 'untraced' ? (
                  <p className="now">Not visible yet.</p>
                ) : state === 'held' ? (
                  <p className="now">{fact.held}</p>
                ) : (
                  <p className="now">{fact.now}</p>
                )}
                {state !== 'held' && state !== 'untraced' ? (
                  <p className="held">
                    <span>Holds as</span> {fact.held}
                  </p>
                ) : null}
                {seat ? (
                  <p className="seat">
                    <span>{fact.id === 'who' ? 'Seat' : 'Review'}</span> {seat}
                  </p>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
