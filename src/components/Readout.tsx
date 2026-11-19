import { formatHoursUnit, formatPressure, formatSignedHoursUnit, formatWait } from '../lib/format';
import { BAND_COPY, BAND_WORD } from '../lib/operational';
import type { ScenarioResult } from '../lib/types';

export function Readout({
  baseline,
  changed,
  availableHours,
  repairDelta,
  netReleased,
  pressureWithOngoing,
}: {
  baseline: ScenarioResult;
  changed: ScenarioResult | null;
  availableHours: number | null;
  repairDelta: number | null;
  netReleased: number | null;
  pressureWithOngoing: number | null;
}) {
  return (
    <div className="readout">
      <p className={`band-word band-${baseline.band}`}>
        <span>{BAND_WORD[baseline.band]}</span>
        {BAND_COPY[baseline.band]}
      </p>
      {changed ? (
        <p className="legend">The filled mark is this week. The ring is the same week after the change.</p>
      ) : null}
      <dl className="ledger">
        <Line
          label="Hours searching"
          baseline={baseline.repairHours}
          changed={changed ? changed.repairHours : undefined}
        />
        <Line
          label="Total hours required"
          baseline={baseline.requiredHours}
          changed={changed ? changed.requiredHours : undefined}
        />
        <div>
          <dt>Team hours</dt>
          <dd>{formatHoursUnit(availableHours)}</dd>
        </div>
        <Line
          label="Hours left"
          baseline={baseline.marginHours}
          changed={changed ? changed.marginHours : undefined}
          signed
        />
        <div>
          <dt>How full</dt>
          <dd>
            {formatPressure(baseline.pressure)}
            {changed ? <em>{formatPressure(changed.pressure)}</em> : null}
          </dd>
        </div>
        <div>
          <dt>Waiting</dt>
          <dd>
            {baseline.queueState === 'no-steady-state'
              ? 'No steady wait'
              : formatWait(baseline.waitHours)}
            {changed ? (
              <em>
                {changed.queueState === 'no-steady-state'
                  ? 'No steady wait'
                  : formatWait(changed.waitHours)}
              </em>
            ) : null}
          </dd>
        </div>
      </dl>
      {repairDelta !== null ? (
        <p className="delta">
          The change moves search time by {formatSignedHoursUnit(-repairDelta)}, before the hours
          to keep the change.
          {netReleased === null
            ? ' The hours to keep the change are unknown, so what comes back is unknown.'
            : ` After upkeep, the team gets ${formatSignedHoursUnit(netReleased)} back.`}
          {pressureWithOngoing === null
            ? ''
            : ` The team stays ${formatPressure(pressureWithOngoing)} full.`}
        </p>
      ) : null}
      {baseline.issues.length > 0 ? (
        <ul className="issues">
          {baseline.issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function Line({
  label,
  baseline,
  changed,
  signed = false,
}: {
  label: string;
  baseline: number | null;
  changed?: number | null;
  signed?: boolean;
}) {
  const text = signed ? formatSignedHoursUnit : formatHoursUnit;
  return (
    <div>
      <dt>{label}</dt>
      <dd>
        {text(baseline)}
        {changed === undefined ? null : <em>{text(changed)}</em>}
      </dd>
    </div>
  );
}
