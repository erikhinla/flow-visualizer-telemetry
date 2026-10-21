import type { AudienceId } from './audiences';
import { stageFor } from './stage';
import type { PressureId, ProfileId } from './types';

/**
 * The PROOF summary: 3 to 4 sentences built only from the answers.
 * Never names a department. States only what an answer said.
 */
const ROUTE: Record<AudienceId, { business: string; start: string; end: string }> = {
  agency: { business: 'agency', start: 'the first brief', end: 'final delivery' },
  consulting: { business: 'firm', start: 'engagement kickoff', end: 'the final deliverable' },
  service: { business: 'business', start: 'the first call', end: 'the finished job' },
};

const OPEN: Record<ProfileId, (r: (typeof ROUTE)[AudienceId]) => string> = {
  FRAGMENTED: (r) => `In your ${r.business}, work gets from ${r.start} to ${r.end} because people carry it, not because a shared record does.`,
  STALLED: (r) => `In your ${r.business}, work starts at ${r.start} and is meant to reach ${r.end}, but it waits in the gaps between steps.`,
  SCALING: (r) => `In your ${r.business}, work gets from ${r.start} to ${r.end}, but the same context gets rebuilt along the way.`,
  COMPOUNDING: (r) => `In your ${r.business}, work moves from ${r.start} to ${r.end} on a route that is mostly connected.`,
};

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export function narrative(input: {
  audienceId: AudienceId;
  profile: ProfileId;
  pressures: readonly PressureId[];
  label: (id: PressureId) => string;
}): string {
  const r = ROUTE[input.audienceId];
  const out = [OPEN[input.profile](r)];
  const [p0, ...rest] = input.pressures;
  if (!p0) {
    out.push('No single stall point stood out in your answers. What friction there is sits across the route, not in one place.');
    out.push(`The fix is one shared record for the whole route, from ${r.start} to ${r.end}, so it holds as the work grows.`);
    return out.join(' ');
  }
  const s0 = stageFor(input.audienceId, p0);
  out.push(`Your answers show the first stall at ${lower(s0)}: ${lower(input.label(p0))}.`);
  const p1 = rest.find((id) => stageFor(input.audienceId, id) !== s0);
  if (p1) out.push(`They also point to ${lower(stageFor(input.audienceId, p1))}: ${lower(input.label(p1))}.`);
  out.push('The tools work. The structure that holds the context did not keep up, so people carry it.');
  return out.join(' ');
}
