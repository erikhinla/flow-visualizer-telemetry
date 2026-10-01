import Link from 'next/link';
import { FlowTrack } from '../components/FlowTrack';
import { SeizureCurve } from '../components/SeizureCurve';
import { getDepartment } from '../lib/departments';
import { formatHours, formatPressure, formatWait } from '../lib/format';
import { evaluateScenario } from '../lib/operational';

export default function HomePage() {
  const department = getDepartment('PR');
  const result = evaluateScenario(department.sample);
  const handling = result.meanServiceHours === null ? null : result.meanServiceHours * 60;

  return (
    <div className="home">
      <section className="hero">
        <p className="kicker">The work between the work</p>
        <h1>See the friction before it seizes the momentum.</h1>
        <p className="lede">
          AI can raise the quantity, speed, and branching of work. When versions, decisions, and
          ownership do not travel with it, people supply the missing connection by hand. Delivery
          can still look fine. Then the margin closes.
        </p>
        <div className="actions">
          <Link className="button" href="/map">
            Map how work runs
          </Link>
          <Link className="button ghost" href="/visualizer">
            Follow one workflow
          </Link>
        </div>
      </section>

      <section className="hero-instrument" aria-label="Sample public relations scenario">
        <div className="instrument-head">
          <p className="kicker">Sample · not a measured company</p>
          <h2>Public Relations still has margin. The wait is already bending.</h2>
        </div>
        <FlowTrack stages={department.stages} band={result.band} accent={department.accent} />
        <div className="see-grid">
          <div className="readout">
            <p className="band-word band-forming">
              <span>Forming</span>
              Thirty responses a week. A quarter wait on facts or an approver. The role can still
              finish them. The model says handling is about{' '}
              {handling === null ? 'unknown' : Math.round(handling)} minutes, and waiting before
              handling is about {formatWait(result.waitHours)}.
            </p>
            <dl className="ledger">
              <div>
                <dt>Repair</dt>
                <dd>{formatHours(result.repairHours)} h</dd>
              </div>
              <div>
                <dt>Required</dt>
                <dd>{formatHours(result.requiredHours)} h</dd>
              </div>
              <div>
                <dt>Available</dt>
                <dd>{formatHours(department.sample.availableHours)} h</dd>
              </div>
              <div>
                <dt>Margin</dt>
                <dd>{formatHours(result.marginHours)} h</dd>
              </div>
              <div>
                <dt>Pressure</dt>
                <dd>{formatPressure(result.pressure)}</dd>
              </div>
            </dl>
          </div>
          <SeizureCurve
            rho={result.pressure}
            compareRho={null}
            variability={department.sample.variability ?? 1}
            accent={department.accent}
          />
        </div>
      </section>

      <section className="sequence">
        <h2>Follow the work. Then change one connection.</h2>
        <ol>
          <li>
            <span>01</span>
            <strong>Follow</strong>
            One deliverable, the next handoff, the context it needs, and what accepted means.
          </li>
          <li>
            <span>02</span>
            <strong>Expose</strong>
            The finding, reconciling, re-entering, or chasing that a person does so the work can
            move.
          </li>
          <li>
            <span>03</span>
            <strong>Change</strong>
            One missing connection. Not a new stack. Not a blame for the department doing the
            repair.
          </li>
          <li>
            <span>04</span>
            <strong>Measure</strong>
            The same workflow, the same period, before and after. Repair hours, wait, and what got
            accepted.
          </li>
        </ol>
      </section>

      <section className="pair">
        <div>
          <h2>Digital Fog</h2>
          <p>
            The coordination people absorb when output changes faster than ownership, versions,
            decisions, and acceptance criteria. It is invisible because the work still gets
            delivered.
          </p>
        </div>
        <div>
          <h2>Digital Friction</h2>
          <p>
            What the fog becomes: rework, dropped context, delayed decisions, and stalled delivery.
            The instrument watches the margin so you can see that turn while the queue is still
            finite.
          </p>
        </div>
      </section>
    </div>
  );
}
