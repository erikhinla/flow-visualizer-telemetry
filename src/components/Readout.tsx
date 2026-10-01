import { formatHours, formatPressure, formatSignedHours, formatWait } from '../lib/format';
import { BAND_COPY } from '../lib/operational';
import type { ScenarioResult } from '../lib/types';

const BAND_WORD = {
  open: 'Open',
  fog: 'Fog',
  forming: 'Forming',
  closing: 'Closing',
  seized: 'Seized',
  unavailable: 'No capacity',
  unknown: 'Unknown',
} as const;

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
        <p className="legend">Ivory is this scenario. Brass is the changed connection.</p>
      ) : null}
      <dl className="ledger">
        <Line
          label="Reconstruction"
          baseline={baseline.repairHours}
          changed={changed ? changed.repairHours : undefined}
        />
        <Line
          label="Required"
          baseline={baseline.requiredHours}
          changed={changed ? changed.requiredHours : undefined}
        />
        <div>
          <dt>Available</dt>
          <dd>{formatHours(availableHours)} h</dd>
        </div>
        <Line
          label="Margin"
          baseline={baseline.marginHours}
          changed={changed ? changed.marginHours : undefined}
          signed
        />
        <div>
          <dt>Pressure</dt>
          <dd>
            {formatPressure(baseline.pressure)}
            {changed ? <em>{formatPressure(changed.pressure)}</em> : null}
          </dd>
        </div>
        <div>
          <dt>Modeled wait</dt>
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
          The connection changes reconstruction by{' '}
          {formatSignedHours(repairDelta === null ? null : -repairDelta)} h before upkeep.
          {netReleased === null
            ? ' Ongoing hours are unknown, so net release is unknown.'
            : ` After upkeep, modeled net release is ${formatSignedHours(netReleased)} h.`}
          {pressureWithOngoing === null
            ? ''
            : ` Pressure including upkeep is ${formatPressure(pressureWithOngoing)}.`}
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
  const text = signed ? formatSignedHours : (value: number | null) => formatHours(value);
  return (
    <div>
      <dt>{label}</dt>
      <dd>
        {text(baseline)} h{changed === undefined ? null : <em>{text(changed)} h</em>}
      </dd>
    </div>
  );
}
