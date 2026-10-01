import type { BandId, ComparisonResult, ScenarioInputs, ScenarioResult } from './types';
import { DISPLAY_BAND_VERSION, OPERATIONAL_MODEL_VERSION } from './types';

export { DISPLAY_BAND_VERSION, OPERATIONAL_MODEL_VERSION };

/**
 * Display marks on a continuous curve. They are not a certification.
 * At variability 1, waiting is about 2.3× handling time at 0.70
 * and about 9× handling time at 0.90.
 */
export const FORMING_RHO = 0.7;
export const CLOSING_RHO = 0.9;

export const BAND_COPY: Record<BandId, string> = {
  open: 'This desk has spare margin and no modeled reconstruction.',
  fog: 'The desk is absorbing the reconstruction. The work can still ship.',
  forming: 'The margin is thinning. Waiting grows faster than the chase that caused it.',
  closing:
    'A small rise in volume or missing context meets a steep wait. Flights and approvals are exposed.',
  seized: 'Required hours exceed the desk. Unfinished jobs accumulate.',
  unavailable:
    'Demand is positive and available capacity is zero. Pressure is not a finite percentage.',
  unknown: 'A required input is missing or out of range. The result stays unknown.',
};

export function repairHours(
  itemCount: number,
  missingShare: number,
  repairMinutes: number
): number {
  return (itemCount * missingShare * repairMinutes) / 60;
}

export function evaluateScenario(input: ScenarioInputs): ScenarioResult {
  const issues = validate(input, 'baseline');
  if (issues.length > 0) return unknownResult(issues);

  const items = input.itemCount as number;
  const share = input.missingShare as number;
  const minutes = input.repairMinutes as number;
  const necessary = input.necessaryHours as number;
  const other = input.otherHours as number;
  const available = input.availableHours as number;
  const variability = input.variability as number;

  const repair = repairHours(items, share, minutes);
  const required = necessary + repair + other;

  if (available === 0) {
    return {
      known: true,
      issues: [],
      repairHours: repair,
      requiredHours: required,
      pressure: null,
      gapHours: required > 0 ? required : 0,
      marginHours: null,
      meanServiceHours: items > 0 ? required / items : null,
      waitHours: null,
      waitMultiple: null,
      queueState: 'unknown',
      band: required > 0 ? 'unavailable' : 'open',
    };
  }

  const pressure = required / available;
  const margin = available - required;
  const gap = Math.max(0, required - available);
  const meanService = items > 0 ? required / items : null;
  const queue = waiting(pressure, meanService, variability);

  return {
    known: true,
    issues: [],
    repairHours: repair,
    requiredHours: required,
    pressure,
    gapHours: gap,
    marginHours: margin,
    meanServiceHours: meanService,
    waitHours: queue.waitHours,
    waitMultiple: queue.waitMultiple,
    queueState: queue.queueState,
    band: bandFor(pressure, repair),
  };
}

export function compareScenario(input: ScenarioInputs): ComparisonResult {
  const baseline = evaluateScenario(input);
  const changedInput: ScenarioInputs = {
    ...input,
    missingShare: input.nextMissingShare,
    repairMinutes: input.nextRepairMinutes,
  };
  const changedIssues = validate(changedInput, 'changed');
  const ongoingIssues = validateOngoing(input.ongoingHours);
  const changed =
    changedIssues.length > 0 ? unknownResult(changedIssues) : evaluateScenario(changedInput);

  let repairDeltaHours: number | null = null;
  let netReleasedHours: number | null = null;
  let pressureWithOngoing: number | null = null;

  if (
    baseline.repairHours !== null &&
    changed.repairHours !== null &&
    changed.known &&
    baseline.known
  ) {
    repairDeltaHours = baseline.repairHours - changed.repairHours;
    if (input.ongoingHours !== null && ongoingIssues.length === 0) {
      netReleasedHours = repairDeltaHours - input.ongoingHours;
      if (changed.requiredHours !== null && input.availableHours) {
        pressureWithOngoing = (changed.requiredHours + input.ongoingHours) / input.availableHours;
      }
    }
  }

  return {
    baseline,
    changed,
    repairDeltaHours,
    netReleasedHours,
    pressureWithOngoing,
  };
}

function waiting(
  pressure: number,
  meanServiceHours: number | null,
  variability: number
): Pick<ScenarioResult, 'waitHours' | 'waitMultiple' | 'queueState'> {
  if (meanServiceHours === null) {
    return { waitHours: null, waitMultiple: null, queueState: 'unknown' };
  }
  if (pressure >= 1) {
    return { waitHours: null, waitMultiple: null, queueState: 'no-steady-state' };
  }
  const multiple = variability * (pressure / (1 - pressure));
  return {
    waitMultiple: multiple,
    waitHours: multiple * meanServiceHours,
    queueState: 'finite-wait',
  };
}

function bandFor(pressure: number, repair: number): BandId {
  if (pressure >= 1) return 'seized';
  if (pressure >= CLOSING_RHO) return 'closing';
  if (pressure >= FORMING_RHO) return 'forming';
  if (repair > 0) return 'fog';
  return 'open';
}

function validate(input: ScenarioInputs, phase: 'baseline' | 'changed'): string[] {
  const issues: string[] = [];
  const share = phase === 'baseline' ? input.missingShare : input.nextMissingShare;
  const minutes = phase === 'baseline' ? input.repairMinutes : input.nextRepairMinutes;
  requireNumber(issues, 'Item count', input.itemCount, { min: 0 });
  requireNumber(issues, phase === 'baseline' ? 'Missing share' : 'Changed missing share', share, {
    min: 0,
    max: 1,
  });
  requireNumber(
    issues,
    phase === 'baseline' ? 'Repair minutes' : 'Changed repair minutes',
    minutes,
    {
      min: 0,
    }
  );
  requireNumber(issues, 'Necessary hours', input.necessaryHours, { min: 0 });
  requireNumber(issues, 'Other hours', input.otherHours, { min: 0 });
  requireNumber(issues, 'Available hours', input.availableHours, { min: 0 });
  requireNumber(issues, 'Variability', input.variability, { min: 0 });
  if (input.itemCount === 0 && input.availableHours === 0) {
    issues.push('Item count and available hours cannot both be zero.');
  }
  return issues;
}

function validateOngoing(value: number | null): string[] {
  const issues: string[] = [];
  requireNumber(issues, 'Ongoing hours', value, { min: 0 });
  return issues;
}

function requireNumber(
  issues: string[],
  label: string,
  value: number | null,
  bounds: { min: number; max?: number }
): void {
  if (value === null || !Number.isFinite(value)) {
    issues.push(`${label} is unknown.`);
    return;
  }
  if (value < bounds.min || (bounds.max !== undefined && value > bounds.max)) {
    issues.push(`${label} is outside ${bounds.min}–${bounds.max ?? '∞'}.`);
  }
}

function unknownResult(issues: string[]): ScenarioResult {
  return {
    known: false,
    issues,
    repairHours: null,
    requiredHours: null,
    pressure: null,
    gapHours: null,
    marginHours: null,
    meanServiceHours: null,
    waitHours: null,
    waitMultiple: null,
    queueState: 'unknown',
    band: 'unknown',
  };
}

/** Points along W/τ = v·ρ/(1−ρ), clipped so the asymptote can be drawn. */
export function curvePoints(
  variability: number,
  steps = 48
): Array<{ rho: number; multiple: number }> {
  const points: Array<{ rho: number; multiple: number }> = [];
  const maxMultiple = 20;
  for (let step = 1; step <= steps; step += 1) {
    const rho = (step / (steps + 1)) * 0.98;
    const multiple = Math.min(maxMultiple, variability * (rho / (1 - rho)));
    points.push({ rho, multiple });
  }
  return points;
}
