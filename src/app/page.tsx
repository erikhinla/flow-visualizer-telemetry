import Link from 'next/link';
import { Balance } from '../components/Balance';
import { FlowTrack } from '../components/FlowTrack';
import { KeystonePath } from '../components/KeystonePath';
import { SeizureCurve } from '../components/SeizureCurve';
import { TraceBoard } from '../components/TraceBoard';
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
        <div>
          <p className="kicker">PROOF · for marketing agencies</p>
          <h1 className="facts-title">
            <span>Where</span>
            <span>What</span>
            <span>Who</span>
            <span>When</span>
          </h1>
          <p className="lede">
            Those four facts are the foundation of a job. Digital fog hides them. Digital friction
            stalls the desk that has to rebuild them. After the Trace, PROOF opens a path back onto
            context keystones, starting with Folders, Markdown, Scripts, and Protocols.
          </p>
          <div className="actions">
            <Link className="button" href="/visualizer">
              Start the Trace
            </Link>
            <Link className="button ghost" href="/map">
              Scan the agency
            </Link>
          </div>
        </div>
        <aside className="dial">
          <p className="kicker">Public relations · simulated</p>
          <p className="dial-word">Friction</p>
          <p className="lede">The window is bending. The desk can still send the work.</p>
        </aside>
      </section>

      <TraceBoard
        departmentId="PR"
        band={result.band}
        repairHours={result.repairHours}
        known={result.known}
        evidenceKind="simulated"
      />
      <KeystonePath
        departmentId="PR"
        band={result.band}
        repairHours={result.repairHours}
        known={result.known}
        evidenceKind="simulated"
      />

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
        <h2>What the Trace gives an agency.</h2>
        <ol>
          <li>
            <span>01</span>
            <strong>Where the project is</strong>
            The live file, the draft, the master, the handoff. One place, or a search.
          </li>
          <li>
            <span>02</span>
            <strong>What needs done</strong>
            The decision, the next action, the definition of done. Written, or reconstructed.
          </li>
          <li>
            <span>03</span>
            <strong>Who has it, and by when</strong>A named seat and a date. Fog is the chase.
            Friction is the desk already bending.
          </li>
          <li>
            <span>04</span>
            <strong>The keystones</strong>
            Folders, Markdown, Scripts, Protocols. They open only after the Trace can see the desk.
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
