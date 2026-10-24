import { AGENCY_BALANCE } from '../lib/agency';
import { formatHours, formatPressure, formatSignedHoursUnit } from '../lib/format';
import type { BalanceReason } from '../lib/operational';
import type { DepartmentId } from '../lib/types';

const REASON_COPY: Record<Exclude<BalanceReason, 'known'>, string> = {
  'compare-off': "The comparison is off, so hours back aren't shown.",
  'baseline-unknown':
    'Hours back are unknown. A number is missing or out of range.',
  'changed-invalid':
    'Hours back are unknown. A number for the week after the change is missing or out of range.',
  'ongoing-blank':
    'Hours back are unknown until the upkeep hours are filled in.',
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
  /** Hours the search gives back, before the cost of keeping the change. */
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
        ? 'On these numbers, the change costs more hours than it saves. Leave things as they are for now.'
        : net === 0
          ? 'The change pays for itself, and no more.'
          : 'Hours come back once the change is in place.';

  return (
    <section className="balance">
      <p className="kicker">The balance</p>
      <h2>{change}</h2>
      <div className="balance-grid">
        <article>
          <span>Comes back</span>
          <strong>{comesBack === null ? 'Unknown' : `${formatHours(comesBack)} h`}</strong>
          <p>Hours no longer spent searching, before upkeep.</p>
        </article>
        <article>
          <span>Costs to keep</span>
          <strong>{ongoing === null ? 'Unknown' : `${formatHours(ongoing)} h`}</strong>
          <p>Hours a week the change takes to keep up.</p>
        </article>
        <article className={net !== null && net < 0 ? 'is-negative' : undefined}>
          <span>Net for the team</span>
          <strong>{formatSignedHoursUnit(net)}</strong>
          <p>
            {pressureWithOngoing === null
              ? 'How full the team stays is unknown.'
              : `The team stays ${formatPressure(pressureWithOngoing)} full.`}
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
