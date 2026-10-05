import { AGENCY_BALANCE } from '../lib/agency';
import { formatHours, formatPressure, formatSignedHoursUnit } from '../lib/format';
import type { BalanceReason } from '../lib/operational';
import type { DepartmentId } from '../lib/types';

const REASON_COPY: Record<Exclude<BalanceReason, 'known'>, string> = {
  'compare-off': 'The comparison is off, so this desk is not showing what comes back.',
  'baseline-unknown':
    'What comes back is unknown because this desk is missing a number or is out of range.',
  'changed-invalid':
    'What comes back is unknown because the week after the fix is missing a number or is out of range.',
  'ongoing-blank':
    'What comes back is unknown until the hours to keep the fix are filled in with zero or more.',
};

export function Balance({
  departmentId,
  change,
  comesBack,
  ongoing,
  net,
  pressureWithOngoing,
  reason,
}: {
  departmentId: DepartmentId;
  change: string;
  /** Hours the search gives back, before the cost of keeping the fix. */
  comesBack: number | null;
  ongoing: number | null;
  net: number | null;
  pressureWithOngoing: number | null;
  reason: BalanceReason;
}) {
  const balance = AGENCY_BALANCE[departmentId];
  const verdict =
    reason !== 'known'
      ? REASON_COPY[reason]
      : net !== null && net < 0
        ? 'On these numbers the fix costs more than it gives back. Leave it alone for now.'
        : net === 0
          ? 'The fix pays for itself and nothing more. The review below still stays.'
          : 'Hours come back once the fix is kept. The review below stays.';

  return (
    <section className="balance">
      <p className="kicker">The balance</p>
      <h2>{change}</h2>
      <div className="balance-grid">
        <article>
          <span>Comes back</span>
          <strong>{comesBack === null ? 'Unknown' : `${formatHours(comesBack)} h`}</strong>
          <p>Hours your people stop spending on the search, before the cost of keeping the fix.</p>
        </article>
        <article>
          <span>Costs to keep</span>
          <strong>{ongoing === null ? 'Unknown' : `${formatHours(ongoing)} h`}</strong>
          <p>Hours the fix itself asks of this desk each week.</p>
        </article>
        <article className={net !== null && net < 0 ? 'is-negative' : undefined}>
          <span>Net on the desk</span>
          <strong>{formatSignedHoursUnit(net)}</strong>
          <p>
            {pressureWithOngoing === null
              ? 'How full the desk stays, including those hours, is unknown.'
              : `How full the desk stays, including those hours, is ${formatPressure(pressureWithOngoing)}.`}
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
