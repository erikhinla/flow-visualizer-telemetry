import Link from 'next/link';
import { Balance } from '../components/Balance';
import { FlowTrack } from '../components/FlowTrack';
import { SeizureCurve } from '../components/SeizureCurve';
import { getDepartment } from '../lib/departments';
import { formatHours, formatPressure, formatWait } from '../lib/format';
import { compareScenario } from '../lib/operational';
import { DESK_TRACE_PRICE, KEYSTONE_PRICE } from '../lib/offer';

export default function HomePage() {
  const department = getDepartment('PR');
  const comparison = compareScenario(department.sample);
  const result = comparison.baseline;
  const handling = result.meanServiceHours === null ? null : result.meanServiceHours * 60;

  return (
    <div className="home">
      <section className="hero">
        <div>
          <p className="kicker">Erik H Bush · twenty years in marketing operations</p>
          <h1>
            The client asked
            <br />
            where the approval stands.
          </h1>
          <p className="benefit">
            Someone is rebuilding that answer from Slack, email, and memory. The purchase to refuse
            is another project tool, or a coordinator hired to own status.
          </p>
          <p className="lede">
            I have not published a client result from this trace, and I will not invent one. The
            free scan is fifteen questions. The {DESK_TRACE_PRICE} is ninety minutes on one
            function, using your counts.{' '}
            <a href="https://erikhbush.com/story">The operating history is here.</a>
          </p>
          <div className="actions">
            <Link className="button" href="/map">
              Scan the agency
            </Link>
            <Link className="button ghost" href="/visualizer?desk=PR">
              See the account sample
            </Link>
          </div>
        </div>
        <aside className="dial">
          <p className="kicker">What the trace decides</p>
          <p className="dial-word">Yes or no</p>
          <p className="lede">
            Buy the fix, or leave it alone. The client’s approval still has to come from a person.
          </p>
        </aside>
      </section>

      <section className="hero-instrument" aria-label="Sample public relations scenario">
        <div className="instrument-head">
          <p className="kicker">Sample · not a measured agency</p>
          <h2>The statement can still go out. Someone is still looking for permission.</h2>
          <p className="lede">
            If that hunt shrinks, the response still leaves with a named yes. The hours below are a
            sample of what the hunt is costing. They are not your studio.
          </p>
        </div>
        <FlowTrack stages={department.stages} band={result.band} accent={department.accent} />
        <div className="see-grid">
          <div className="readout">
            <p className="band-word band-forming">
              <span>Forming</span>
              Thirty responses a week. A quarter are waiting on the facts or a named approver. The
              desk can still send them. Each one takes about{' '}
              {handling === null ? 'unknown' : Math.round(handling)} minutes to handle, and about{' '}
              {formatWait(result.waitHours)} of waiting before that. It has not stalled. You can
              still see it in time to act.
            </p>
            <dl className="ledger">
              <div>
                <dt>Hours spent finding it</dt>
                <dd>{formatHours(result.repairHours)} h</dd>
              </div>
              <div>
                <dt>Hours the desk needs</dt>
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
                <dt>How full</dt>
                <dd>{formatPressure(result.pressure)}</dd>
              </div>
            </dl>
          </div>
          <SeizureCurve
            rho={result.pressure}
            compareRho={comparison.changed.pressure}
            variability={department.sample.variability ?? 1}
            accent={department.accent}
            caption="How long the job waits, compared with the time it takes to do it. The cliff is the picture, not a stopwatch on your studio."
          />
        </div>
        <Balance
          departmentId="PR"
          change={department.action.change}
          comesBack={comparison.repairDeltaHours}
          ongoing={department.sample.ongoingHours}
          net={comparison.netReleasedHours}
          pressureWithOngoing={comparison.pressureWithOngoing}
          reason="known"
        />
      </section>

      <section className="sequence">
        <h2>You already know this week.</h2>
        <ol>
          <li>
            <span>01</span>
            <strong>Account is rebuilding a yes</strong>
            The client asked where the approval stands. The answer is in three threads.
          </li>
          <li>
            <span>02</span>
            <strong>Creative is starting the round over</strong>
            The work is done. The notes that explain it are not on the work.
          </li>
          <li>
            <span>03</span>
            <strong>A statement is waiting on permission</strong>
            It can still go out. The window is closing while someone finds the approver.
          </li>
          <li>
            <span>04</span>
            <strong>You get the hours back, or you don’t</strong>
            PROOF says so before you buy another tool. The judgment stays with your people.
          </li>
        </ol>
      </section>

      <section className="pair">
        <div>
          <h2>Your numbers, not ours</h2>
          <p>
            The sample above is a public-relations desk we made up so you can see the shape. Your
            Desk Trace replaces it with your volume, your missing share, and the hours that desk
            actually has. A blank stays unknown. PROOF will not invent a result.
          </p>
        </div>
        <div>
          <h2>The part you do not give away</h2>
          <p>
            Getting hours back is the point. Losing the client’s approval, the creative direction,
            the rights, or a human read of the spend is not. If the fix costs more than it returns,
            the record says leave it alone.
          </p>
        </div>
      </section>

      <section className="sequence" id="offer">
        <h2>Ninety minutes. One function. Your counts. A yes or a no.</h2>
        <p className="lede">
          Account, creative, production, public relations, or media. You bring last week’s volume,
          how many items had no current file or named approver, the minutes to reconstruct one, and
          the hours that function had. You leave with that record and a decision on the fix.
        </p>
        <ol>
          <li>
            <span>01</span>
            <strong>Scan · free</strong>
            Fifteen questions. A profile and an hour band. Answers suggest. They do not measure the
            studio.
          </li>
          <li>
            <span>02</span>
            <strong>Trace · {DESK_TRACE_PRICE}</strong>
            Ninety minutes with Erik H Bush. Your counts replace the sample. The record says buy
            the fix, or leave it alone.
          </li>
          <li>
            <span>03</span>
            <strong>Install · {KEYSTONE_PRICE}</strong>
            Two weeks. The file, the written decision, the check, and the owner. Only after the
            trace says the hours come back.
          </li>
        </ol>
        <div className="actions">
          <Link className="button" href="/offer">
            Book the Desk Trace — {DESK_TRACE_PRICE}
          </Link>
          <Link className="button ghost" href="/map">
            Scan the agency
          </Link>
        </div>
      </section>
    </div>
  );
}
