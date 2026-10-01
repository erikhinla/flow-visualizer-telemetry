import { AGENCY_BALANCE } from '../lib/agency';
import { formatHours, formatPressure, formatSignedHours } from '../lib/format';
import type { DepartmentId } from '../lib/types';

export function Balance({
  departmentId,
  change,
  comesBack,
  ongoing,
  net,
  pressureWithOngoing,
}: {
  departmentId: DepartmentId;
  change: string;
  /** Reconstruction hours removed by the connection, before upkeep. */
  comesBack: number | null;
  ongoing: number | null;
  net: number | null;
  pressureWithOngoing: number | null;
}) {
  const balance = AGENCY_BALANCE[departmentId];
  const verdict =
    net === null
      ? 'Net is unknown until the hours to keep the connection are filled in.'
      : net < 0
        ? 'On these numbers the connection costs more than it returns. Do not add it yet.'
        : net === 0
          ? 'The connection pays for itself and nothing more. The review below still stays.'
          : 'Hours come back after the connection is kept. The review below stays.';

  return (
    <section className="balance">
      <p className="kicker">The balance</p>
      <h2>{change}</h2>
      <div className="balance-grid">
        <article>
          <span>Comes back</span>
          <strong>{comesBack === null ? 'Unknown' : `${formatHours(comesBack)} h`}</strong>
          <p>Reconstruction removed, before the cost of keeping the connection.</p>
        </article>
        <article>
          <span>Costs to keep</span>
          <strong>{ongoing === null ? 'Unknown' : `${formatHours(ongoing)} h`}</strong>
          <p>Hours the new connection itself asks of the desk each period.</p>
        </article>
        <article className={net !== null && net < 0 ? 'is-negative' : undefined}>
          <span>Net on the desk</span>
          <strong>{formatSignedHours(net)} h</strong>
          <p>
            {pressureWithOngoing === null
              ? 'Pressure including upkeep is unknown.'
              : `Pressure including upkeep is ${formatPressure(pressureWithOngoing)}.`}
          </p>
        </article>
      </div>
      <p className={net !== null && net < 0 ? 'verdict is-negative' : 'verdict'}>{verdict}</p>
      <div className="balance-note">
        <div>
          <h3>Where the hours go</h3>
          <p>{balance.returnsTo}</p>
        </div>
        <div>
          <h3>Review that stays</h3>
          <p>{balance.keeps}</p>
        </div>
        <div>
          <h3>Result to protect</h3>
          <p>{balance.protects}</p>
        </div>
      </div>
    </section>
  );
}
