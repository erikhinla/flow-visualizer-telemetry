import type { AudienceId } from './audiences';
import type { ArchetypeId, PressureId, ProfileId } from './types';

/**
 * The woven PROOF story: 3 to 4 sentences built from the user's answers.
 * Blames the system, never the reader. Uses "stall". No em dashes.
 */

const ROUTE: Record<AudienceId, { business: string; start: string; end: string; client: string }> = {
  agency: { business: 'agency', start: 'the first brief', end: 'final delivery', client: 'client' },
  consulting: { business: 'firm', start: 'engagement kickoff', end: 'the final deliverable', client: 'client' },
  service: { business: 'business', start: 'the first call', end: 'the finished job', client: 'customer' },
};

const OPEN: Record<ProfileId, (r: (typeof ROUTE)[AudienceId]) => string> = {
  FRAGMENTED: (r) => `In your ${r.business}, work gets from ${r.start} to ${r.end} because people carry it, not because a shared record does.`,
  STALLED: (r) => `In your ${r.business}, work starts at ${r.start} and is meant to reach ${r.end}, but it waits in the gaps between steps.`,
  SCALING: (r) => `In your ${r.business}, work gets from ${r.start} to ${r.end}, but the same context gets rebuilt along the way.`,
  COMPOUNDING: (r) => `In your ${r.business}, work moves from ${r.start} to ${r.end} on a route that is mostly connected.`,
};

const CLAUSE: Record<PressureId, (client: string) => string> = {
  start: () => 'jobs wait before the work can start',
  handoff: () => 'momentum drops each time the work changes hands',
  next: () => 'the next step gets worked out in the moment',
  priorities: () => 'priorities live in conversations instead of one place',
  memory: () => 'the brief, the approval, or the feedback sits with people instead of in the record',
  scattered: () => 'the job record sits in several places',
  tools: () => 'AI tools sit outside the core work',
  learning: () => 'what one job teaches does not carry into the next',
  followup: (c) => `${c} asks wait on someone remembering`,
  'loose-followup': () => 'follow-up runs on a loose process',
  ownership: () => 'no one clearly owns the next move',
  'informal-owner': () => 'ownership goes to whoever is free',
  ai: () => 'AI is in the work without operating rules',
  decisions: () => 'pressured decisions have no written rule to lean on',
  revenue: () => 'revenue depends on someone remembering to follow up',
  'some-manual': () => 'some revenue still depends on manual follow-up',
  repeat: () => 'work that already exists gets found or made again',
  'sometimes-repeat': () => 'some work gets made again instead of reused',
  'key-person': () => 'one person out slows the whole job',
  pipeline: () => 'live work and approvals cannot be seen',
  'partial-pipe': () => 'live work is only partly visible',
  loop: () => 'shipped work does not change how the next job runs',
  shape: () => 'each day runs on reaction instead of a set route',
};

const CAUSE: Record<ArchetypeId, (r: (typeof ROUTE)[AudienceId]) => string> = {
  bottleneckOperator: (r) => `The system still routes work through a person, so the ${r.business} moves at the pace of whoever holds the context.`,
  toolOverload: () => 'The handoffs between tools and desks are where the route needs one shared record.',
  executionStall: () => 'The route has no set next step, so each stage waits to be worked out.',
  fragmentedWorkflow: () => 'The pieces live in different places, so people rebuild the picture before the work can move.',
};

export function narrative(input: {
  audienceId: AudienceId;
  profile: ProfileId;
  where: string | null;
  pressures: readonly PressureId[];
  archetype: ArchetypeId | null | undefined;
}): string {
  const r = ROUTE[input.audienceId];
  const out = [OPEN[input.profile](r)];
  const [p0, p1] = input.pressures;
  if (p0) {
    const place = input.where ? `in ${input.where.toLowerCase()}` : 'early';
    out.push(`The first stall shows up ${place}, where ${CLAUSE[p0](r.client)}.`);
    if (p1) {
      const c = CLAUSE[p1](r.client);
      out.push(`From there, ${c}, and the ${r.client} feels the wait.`);
    }
  } else {
    out.push('None of your answers flagged a stall point, so the route mostly holds.');
  }
  out.push(input.archetype ? CAUSE[input.archetype](r) : 'No single cause stood out, so the fix starts where the first stall sits.');
  return out.join(' ');
}
