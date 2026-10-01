import Link from 'next/link';
import { Balance } from '../components/Balance';
import { FlowTrack } from '../components/FlowTrack';
import { SeizureCurve } from '../components/SeizureCurve';
import { getDepartment } from '../lib/departments';
import { formatHours, formatPressure, formatWait } from '../lib/format';
import { compareScenario } from '../lib/operational';

export default function HomePage() {
  const department = getDepartment('PR');
  const comparison = compareScenario(department.sample);
  const result = comparison.baseline;
  const handling = result.meanServiceHours === null ? null : result.meanServiceHours * 60;

  return (
    <div className="home">
      <section className="hero">
        <p className="kicker">PROOF · for marketing agencies</p>
        <h1>See the hours before they take the launch.</h1>
        <p className="lede">
          A campaign can still ship while account, creative, and media spend the week reconstructing
          approvals, versions, and spend. PROOF puts that load on one desk, then shows a connection
          that gives time back without cutting the review that protects the work.
        </p>
        <div className="actions">
          <Link className="button" href="/map">
            Scan the agency
          </Link>
          <Link className="button ghost" href="/visualizer">
            Open a desk
          </Link>
        </div>
      </section>

      <section className="hero-instrument" aria-label="Sample public relations scenario">
        <div className="instrument-head">
          <p className="kicker">Sample · not a measured agency</p>
          <h2>Statements are still going out. The window is already bending.</h2>
        </div>
        <FlowTrack stages={department.stages} band={result.band} accent={department.accent} />
        <div className="see-grid">
          <div className="readout">
            <p className="band-word band-forming">
              <span>Forming</span>
              Thirty responses a week. A quarter wait on current facts or a named approver. The desk
              can still send them. Handling is about{' '}
              {handling === null ? 'unknown' : Math.round(handling)} minutes. Waiting before
              handling is about {formatWait(result.waitHours)}. The flight has not seized. It is
              close enough to see.
            </p>
            <dl className="ledger">
              <div>
                <dt>Reconstruction</dt>
                <dd>{formatHours(result.repairHours)} h</dd>
              </div>
              <div>
                <dt>Required</dt>
                <dd>{formatHours(result.requiredHours)} h</dd>
              </div>
              <div>
                <dt>Desk hours</dt>
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
            compareRho={comparison.changed.pressure}
            variability={department.sample.variability ?? 1}
            accent={department.accent}
          />
        </div>
        <Balance
          departmentId="PR"
          change={department.action.change}
          comesBack={comparison.repairDeltaHours}
          ongoing={department.sample.ongoingHours}
          net={comparison.netReleasedHours}
          pressureWithOngoing={comparison.pressureWithOngoing}
        />
      </section>

      <section className="sequence">
        <h2>What an agency can take from the scan.</h2>
        <ol>
          <li>
            <span>01</span>
            <strong>Where the hours leave the craft</strong>
            Reconstruction, chasing, and reconciliation. Not the making, and not the review the work
            needs.
          </li>
          <li>
            <span>02</span>
            <strong>Whether the next flight can still make it</strong>
            Pressure and the wait curve. Forming is a warning. Seized means the desk is already
            behind the work.
          </li>
          <li>
            <span>03</span>
            <strong>One connection, not a new stack</strong>
            The brief, the approval, the master, the approver, or the shared definition of spend.
          </li>
          <li>
            <span>04</span>
            <strong>The balance</strong>
            Hours that come back, hours the fix costs to keep, the review that stays, and the result
            that must not get worse.
          </li>
        </ol>
      </section>

      <section className="pair">
        <div>
          <h2>The data</h2>
          <p>
            Item count, the share missing the connection, minutes to reconstruct one, craft and
            required review, and the hours that desk actually has. Blank stays unknown. A sample
            stays simulated until you say otherwise.
          </p>
        </div>
        <div>
          <h2>The result to hold</h2>
          <p>
            Faster is not the goal by itself. Client approval, creative direction, rights, and a
            human read of spend stay in the fix. If the connection costs more hours than it returns,
            PROOF says so.
          </p>
        </div>
      </section>
    </div>
  );
}
