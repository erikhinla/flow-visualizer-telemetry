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
  FRAGMENTED: (r) => `In the ${r.business}, work gets from ${r.start} to ${r.end} because people carry the context, not because a shared record does.`,
  STALLED: (r) => `In the ${r.business}, work starts at ${r.start} and is meant to reach ${r.end}, but the work waits in the gaps between steps.`,
  SCALING: (r) => `In the ${r.business}, work gets from ${r.start} to ${r.end}, but the same context gets rebuilt along the way.`,
  COMPOUNDING: (r) => `In the ${r.business}, work moves from ${r.start} to ${r.end} on a route that's mostly connected.`,
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
    out.push("The answers don't show work stalling at one stage. What friction there is sits across the route.");
    out.push(`One shared record for the whole route, from ${r.start} to ${r.end}, keeps context with the work as the work grows.`);
    return out.join(' ');
  }
  const s0 = stageFor(input.audienceId, p0);
  out.push(`The answers show work stalling first at ${lower(s0)}: ${lower(input.label(p0))}.`);
  const p1 = rest.find((id) => stageFor(input.audienceId, id) !== s0);
  if (p1) out.push(`They also point to ${lower(stageFor(input.audienceId, p1))}: ${lower(input.label(p1))}.`);
  out.push("The tools work. The structure that keeps context with the work didn't keep up, so people carry the context by hand.");
  return out.join(' ');
}
