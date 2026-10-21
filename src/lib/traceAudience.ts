import type { AudienceId } from './audiences';
import { DESK_TRACE, type DeskTrace } from './trace';
import type { DepartmentId } from './types';

/**
 * Keystone card and before/after text in each business type's own route words.
 * Agency keeps DESK_TRACE. Same four facts, same four Keystones, same order.
 */
type Pair = [string, string];
const t = (f: [Pair, Pair, Pair, Pair], k: [Pair, Pair, Pair, Pair]): DeskTrace => ({
  facts: [
    { id: 'where', now: f[0][0], held: f[0][1] },
    { id: 'what', now: f[1][0], held: f[1][1] },
    { id: 'who', now: f[2][0], held: f[2][1] },
    { id: 'when', now: f[3][0], held: f[3][1] },
  ],
  keystones: [
    { id: 'folders', name: 'Folders', holds: k[0][0], action: k[0][1] },
    { id: 'markdown', name: 'Markdown', holds: k[1][0], action: k[1][1] },
    { id: 'scripts', name: 'Scripts', holds: k[2][0], action: k[2][1] },
    { id: 'protocols', name: 'Protocols', holds: k[3][0], action: k[3][1] },
  ],
});

const CONSULTING: Record<DepartmentId, DeskTrace> = {
  ACC: t(
    [
      ['The current deck is split across email threads and desktops.', 'One engagement folder holds the current deliverable.'],
      ['What the client signed off, and what comes next, is rebuilt from memory.', 'The sign-off and the next action are written on the deliverable.'],
      ['The partner is rebuilding who decided.', 'The decision owner is named on the deliverable.'],
      ['Sign-off moves when the chase ends.', 'The deliverable has a date it must move.'],
    ],
    [
      ['Where', 'Keep only the current deliverable in the engagement folder. Older versions leave the live path.'],
      ['What', 'On the deliverable, write the sign-off, the change, and the next action.'],
      ['The check', 'Before a deliverable goes to the client, check that the folder, the note, the owner, and the date are present.'],
      ['Who and when', 'Name the owner and the date the deliverable moves.'],
    ]
  ),
  FIN: t(
    [
      ['Hours, scope, and invoices sit in different systems.', 'One billing view joins scope, hours, and the invoice.'],
      ['Each billing question is reconstructed from timesheets.', 'The engagement code says what still must match.'],
      ['Billing is matching records nobody owns.', 'The person who clears a billing question is named.'],
      ['Open billing questions have no age limit.', 'Each billing question has an age at which it escalates.'],
    ],
    [
      ['Where', 'Join scope, hours, and the invoice in one billing view.'],
      ['What', 'Write the engagement code and what still must match.'],
      ['The check', 'Check the engagement code before an invoice goes out.'],
      ['Who and when', 'Name who clears a billing question, and the age that escalates it.'],
    ]
  ),
  LGL: t(
    [
      ['The signed scope sits apart from the work it covers.', 'The signed scope travels with the engagement.'],
      ['Scope gaps surface after the work is done.', 'What the contract covers is listed on the engagement.'],
      ['Someone hunts for the signed version.', 'The person who approves a scope change is named.'],
      ['Change requests wait while the contract is found.', 'Each change request has a decision date.'],
    ],
    [
      ['Where', 'File the signed scope with the engagement.'],
      ['What', 'List what the contract covers and what it does not.'],
      ['The check', 'New work cannot start until it maps to the signed scope or an approved change.'],
      ['Who and when', 'Name who approves a scope change, and by when.'],
    ]
  ),
  PRD: t(
    [
      ['Drafts and finals share one shared drive.', 'The final deliverable has its own folder. Drafts stay out.'],
      ['Which version is final is a search.', 'Status, sources, and the client requirements are written on the final.'],
      ['Consultants hunt for the version that may ship.', 'The person who may mark a final is named.'],
      ['Handover waits on the hunt.', 'The final carries its handover date.'],
    ],
    [
      ['Where', 'Put the final deliverable in its own folder. Leave drafts out.'],
      ['What', 'Write status, sources, and the client requirements on the final.'],
      ['The check', 'Refuse handover of a file that is not marked final.'],
      ['Who and when', 'Name who may mark a final, and the handover date.'],
    ]
  ),
  STR: t(
    [
      ['Workshop notes and decks are everywhere. The question is not.', 'One engagement folder holds the recommendation.'],
      ['The recommendation gets rebuilt each time the client asks.', 'The question, sources, assumptions, criteria, and next action are written.'],
      ['The meeting is spent agreeing what is being decided.', 'The decision owner on the client side is named.'],
      ['Decisions reopen because nothing closed them.', 'The decision has a due date.'],
    ],
    [
      ['Where', 'Keep the recommendation in one engagement folder.'],
      ['What', 'Write the question, the sources, the assumptions, the criteria, and the next action.'],
      ['The check', 'A recommendation cannot go to the client without those five lines.'],
      ['Who and when', 'Name the decision owner and the due date.'],
    ]
  ),
  CRT: t(
    [
      ['Client comments live apart from the draft.', 'The draft, the scope, and the live comments sit together.'],
      ['The ask is reconstructed each round.', 'Agreed direction and consolidated comments are one note.'],
      ['Consultants rebuild the scope before writing.', 'The person who accepts a round is named.'],
      ['Rounds eat the time the thinking needed.', 'The round has a due date.'],
    ],
    [
      ['Where', 'Keep the draft, the scope, and the live comments in one place.'],
      ['What', 'Write the agreed direction and the consolidated comments.'],
      ['The check', 'A new round starts only from that note.'],
      ['Who and when', 'Name who accepts a round, and the due date.'],
    ]
  ),
  PR: t(
    [
      ['The facts and the draft live apart.', 'The draft and the evidence sit together.'],
      ['The message waits on what is true and who may say it.', 'Current facts and the message type are written on the draft.'],
      ['Someone is chasing the approver.', 'The approver is named.'],
      ['The window closes during the chase.', 'The message has a window.'],
    ],
    [
      ['Where', 'Keep the draft and the evidence together.'],
      ['What', 'Write the current facts and the message type on the draft.'],
      ['The check', 'A draft cannot start until the facts and the approver are on it.'],
      ['Who and when', 'Name the approver and the window.'],
    ]
  ),
  MED: t(
    [
      ['Leads, proposals, and wins use different names.', 'One record joins the lead, the proposal, and the result.'],
      ['Reporting is reconciliation.', 'Shared definitions are written once.'],
      ['Someone rebuilds the pipeline before anyone can read it.', 'The person who resolves a difference is named.'],
      ['Reporting lags the quarter.', 'Differences are resolved by the reporting date.'],
    ],
    [
      ['Where', 'Join the lead, the proposal, and the result in one record.'],
      ['What', 'Write the shared definitions once.'],
      ['The check', 'Flag a pipeline line with no definition before the report goes out.'],
      ['Who and when', 'Name who resolves a difference, and by which reporting date.'],
    ]
  ),
  HR: t(
    [
      ['Staffing decisions point at an old policy, or none.', 'The governing policy is filed with the staffing case.'],
      ['Which rule applies is a search.', 'The situation and the rule are on the case.'],
      ['People operations checks the policy before the case can move.', 'The reviewer for exceptions is named.'],
      ['Corrections arrive after the decision.', 'The case has a date.'],
    ],
    [
      ['Where', 'File the governing policy with the case.'],
      ['What', 'Write the situation and the rule that applies.'],
      ['The check', 'A decision cannot be issued against an unmarked policy version.'],
      ['Who and when', 'Name the reviewer for exceptions, and the date.'],
    ]
  ),
  OPS: t(
    [
      ['The handoff between consultants has no accepted place to land.', 'There is a place the next consultant accepts the work.'],
      ['Done is undefined.', 'The next action and the definition of done are written.'],
      ['Nobody accepted it, so a partner bridges the gap.', 'The consultant who accepted the handoff is named.'],
      ['Handoffs age with no due date.', 'The handoff has a date.'],
    ],
    [
      ['Where', 'Give the work a place the next consultant accepts.'],
      ['What', 'Write the next action and the definition of done.'],
      ['The check', 'A handoff without an accepted owner and a done line stays open.'],
      ['Who and when', 'Name the owner, the escalation, and the date.'],
    ]
  ),
};

const SERVICE: Record<DepartmentId, DeskTrace> = {
  ACC: t(
    [
      ['What was promised is spread across texts, calls, and the office calendar.', 'One job folder holds the current quote and the promise.'],
      ['What the customer approved, and what happens next, is pieced together.', 'The approval and the next step are written on the job.'],
      ['The office is rebuilding who said yes.', 'The person who owns the follow-up is named on the job.'],
      ['Follow-up happens when someone remembers.', 'The job has a follow-up date.'],
    ],
    [
      ['Where', 'Keep the current quote and the approval in one job folder.'],
      ['What', 'On the job, write what was promised, the approval, and the next step.'],
      ['The check', 'Before a job is booked, check that the quote, the approval, the owner, and the date are present.'],
      ['Who and when', 'Name who follows up, and the date.'],
    ]
  ),
  FIN: t(
    [
      ['The quote, the work order, and the invoice sit in different places.', 'One job record joins the quote, the work done, and the invoice.'],
      ['Each billing question is pieced together from notes.', 'The job number says what still must match.'],
      ['Invoicing is matching records nobody owns.', 'The person who clears a billing question is named.'],
      ['Unpaid invoices have no watched age.', 'Each unpaid invoice has an age at which it escalates.'],
    ],
    [
      ['Where', 'Join the quote, the work done, and the invoice in one job record.'],
      ['What', 'Write the job number and what still must match.'],
      ['The check', 'Check the job number before an invoice goes out.'],
      ['Who and when', 'Name who clears a billing question, and the age that escalates it.'],
    ]
  ),
  LGL: t(
    [
      ['Permits and certificates sit apart from the job.', 'Permits and certificates travel with the job.'],
      ['Gaps are found on site, not before.', 'What the job requires is listed on the job.'],
      ['Someone hunts for the paperwork.', 'The person who signs off compliance is named.'],
      ['The job waits while paperwork is found.', 'Paperwork is attached by the start date.'],
    ],
    [
      ['Where', 'File permits and certificates with the job.'],
      ['What', 'List what the job requires before work starts.'],
      ['The check', 'A job cannot start if a required permit or certificate is missing.'],
      ['Who and when', 'Name who signs off compliance, and the date.'],
    ]
  ),
  PRD: t(
    [
      ['Job notes live in texts and the tech’s memory.', 'The job record holds the scope, photos, and notes.'],
      ['What the crew needs on site is a phone call.', 'The scope, materials, and access details are written on the job.'],
      ['The tech calls the office to find out what was sold.', 'The lead tech for the job is named.'],
      ['The job waits on the call back.', 'The job has a scheduled finish.'],
    ],
    [
      ['Where', 'Keep the scope, photos, and notes in the job record.'],
      ['What', 'Write the scope, the materials, and the access details.'],
      ['The check', 'A crew does not roll until the job record is complete.'],
      ['Who and when', 'Name the lead tech and the finish date.'],
    ]
  ),
  STR: t(
    [
      ['Plans live in the owner’s head.', 'One planning folder holds the decision.'],
      ['The plan gets rebuilt each time it comes up.', 'The question, numbers, criteria, and next step are written.'],
      ['Meetings are spent working out what is being decided.', 'The decision owner is named.'],
      ['Decisions reopen because nothing closed them.', 'The decision has a due date.'],
    ],
    [
      ['Where', 'Keep the decision in one planning folder.'],
      ['What', 'Write the question, the numbers, the criteria, and the next step.'],
      ['The check', 'A plan cannot be acted on without those lines.'],
      ['Who and when', 'Name the decision owner and the due date.'],
    ]
  ),
  CRT: t(
    [
      ['Photos, offers, and feedback live in different places.', 'The piece, the offer, and the feedback sit together.'],
      ['The ask is rebuilt each round.', 'The approved offer and feedback are one note.'],
      ['Whoever makes it rebuilds the brief first.', 'The person who approves the piece is named.'],
      ['Rounds eat the time the work needed.', 'The piece has a due date.'],
    ],
    [
      ['Where', 'Keep the piece, the offer, and the feedback in one place.'],
      ['What', 'Write the approved offer and the feedback.'],
      ['The check', 'A new round starts only from that note.'],
      ['Who and when', 'Name who approves, and the due date.'],
    ]
  ),
  PR: t(
    [
      ['The review and the job record live apart.', 'The review is linked to the job.'],
      ['The reply waits on what actually happened on the job.', 'The job facts are written next to the reply.'],
      ['Someone is chasing who was on site.', 'The person who replies is named.'],
      ['The reply comes too late to help.', 'Each review has a reply window.'],
    ],
    [
      ['Where', 'Link each review to its job record.'],
      ['What', 'Write the job facts next to the reply.'],
      ['The check', 'A reply does not go out until the job facts are on it.'],
      ['Who and when', 'Name who replies, and the window.'],
    ]
  ),
  MED: t(
    [
      ['The schedule, the jobs, and the crew list use different names.', 'One schedule joins the job, the crew, and the time.'],
      ['Dispatch is reconciliation.', 'Job types and time blocks are defined once.'],
      ['The dispatcher rebuilds the day by phone.', 'The person who resolves a conflict is named.'],
      ['Changes land after the crew has left.', 'Conflicts are resolved before dispatch.'],
    ],
    [
      ['Where', 'Join the job, the crew, and the time in one schedule.'],
      ['What', 'Define job types and time blocks once.'],
      ['The check', 'Flag a booking with no job type before dispatch.'],
      ['Who and when', 'Name who resolves a conflict, and by when.'],
    ]
  ),
  HR: t(
    [
      ['Crew rules live in someone’s memory.', 'The crew policy is filed where the crew can find it.'],
      ['Which rule applies is a phone call.', 'The situation and the rule are written down.'],
      ['The owner settles each case by hand.', 'The reviewer for exceptions is named.'],
      ['Corrections arrive after the fact.', 'Each case has a date.'],
    ],
    [
      ['Where', 'File the crew policy where the crew can find it.'],
      ['What', 'Write the situation and the rule that applies.'],
      ['The check', 'A decision is not made against an outdated policy.'],
      ['Who and when', 'Name the reviewer for exceptions, and the date.'],
    ]
  ),
  OPS: t(
    [
      ['The handoff from office to field has no accepted place to land.', 'There is a place the crew accepts the job.'],
      ['Done is undefined.', 'The next step and the definition of done are written.'],
      ['Nobody accepted it, so the owner bridges the gap.', 'The person who accepted the job is named.'],
      ['Handoffs age with no due date.', 'The handoff has a date.'],
    ],
    [
      ['Where', 'Give the job a place the crew accepts.'],
      ['What', 'Write the next step and the definition of done.'],
      ['The check', 'A job without an accepted owner and a done line stays open.'],
      ['Who and when', 'Name the owner, the escalation, and the date.'],
    ]
  ),
};

export function deskTraceFor(audienceId: AudienceId, id: DepartmentId): DeskTrace {
  if (audienceId === 'consulting') return CONSULTING[id];
  if (audienceId === 'service') return SERVICE[id];
  return DESK_TRACE[id];
}
