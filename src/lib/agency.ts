import type { DepartmentId } from './types';

/**
 * What a marketing agency needs beside the hours:
 * time returned to the work, the review that must stay, and the result that must not get worse.
 */
export interface AgencyBalance {
  /** Where recovered hours go back to. */
  returnsTo: string;
  /** Judgment the connection does not remove. */
  keeps: string;
  /** The client-facing result to compare, so speed does not hollow out the work. */
  protects: string;
}

export const AGENCY_BALANCE: Record<DepartmentId, AgencyBalance> = {
  ACC: {
    returnsTo: 'Account time goes back to the client, not to reconstructing the last yes.',
    keeps: "The client still decides. A missing record isn't an approval.",
    protects: 'Approval cycle time can fall without the wrong version going out.',
  },
  FIN: {
    returnsTo: 'Finance time goes back to closing, not to matching charges that share no id.',
    keeps: "A person still releases exceptions. The trail doesn't replace that judgment.",
    protects: "Unresolved invoices age less, without billing a scope the client didn't authorize.",
  },
  LGL: {
    returnsTo: 'Counsel time goes back to the review, not to hunting for rights and source.',
    keeps: 'A material change still reopens the right review.',
    protects: 'Fewer packages come back for missing proof, and the review itself stays.',
  },
  PRD: {
    returnsTo: 'Production time goes back to delivery, not to searching the version stack.',
    keeps: 'Only the approved master ships. Variants stay marked as variants.',
    protects: 'First-pass acceptance can rise without an unapproved cut leaving the building.',
  },
  STR: {
    returnsTo: 'Strategy time goes back to the decision, not to rebuilding the question.',
    keeps: "A named person remains accountable. The brief doesn't decide itself.",
    protects: 'Fewer decisions reopen with no new evidence.',
  },
  CRT: {
    returnsTo: 'Hours go back to the creative work.',
    keeps: 'Direction, criteria, and a real review of the piece stay.',
    protects: 'Rounds that only reconstruct the ask can fall. Thoughtful revision stays.',
  },
  PR: {
    returnsTo: 'Time goes back to the response, not to finding the facts and the approver.',
    keeps: "A named person still releases each response. Speed doesn't replace authorization.",
    protects: "Fewer windows close before a statement is allowed out. Unauthorized copy doesn't.",
  },
  MED: {
    returnsTo: 'Media time goes back to planning, not to reconciling three names for one spend.',
    keeps: 'A person still reads whether the spend matches the intent.',
    protects:
      'Unexplained differences can fall without flattening the plan to the default of one platform.',
  },
  HR: {
    returnsTo:
      'People-team time goes back to the case, not to finding which policy version governs the case.',
    keeps: 'Cases that need a human review still get one.',
    protects: 'Fewer corrections come from a stale policy, and the human check stays.',
  },
  OPS: {
    returnsTo: 'Ops time goes back to moving the work, not to finding an owner for each handoff.',
    keeps: "Done stays explicit. Sending a handoff isn't the same as finishing the work.",
    protects: "Fewer jobs sit ownerless, and incomplete work isn't called complete.",
  },
};
