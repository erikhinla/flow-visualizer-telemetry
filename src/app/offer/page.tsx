import type { Metadata } from 'next';
import Link from 'next/link';
import { BOOKING_MAILTO } from '../../lib/offer';

export const metadata: Metadata = {
  title: 'Talk through the pattern · PROOF',
  description:
    'Ninety minutes on one function. Real counts. A yes or a no on the change. No client result is published yet.',
};

const HUNTS = [
  ['Account', 'The client asks where the approval stands and someone rebuilds the answer from chat threads, email, and memory.', 'Another project tool, or a coordinator hired to own status.'],
  ['Finance', "The invoice is late because the charge can't be tied to the job that approved it.", 'A new billing system, or writing the invoice off.'],
  ['Legal', 'A version is ready and nobody can show who cleared the rights.', 'Shipping the version unsigned, or another reviewer hired to hunt.'],
  ['Production', 'Delivery is waiting on the one person who remembers which file is the master.', 'Another asset library.'],
  ['Strategy', 'The room is full of decks and nobody has said what the decision is.', 'Another workshop, or an AI summary of the pile.'],
  ['Creative', 'The piece is done and the notes are in five threads, so the next round starts over.', 'Billing the client for that round again.'],
  ['Public relations', 'The statement can still go out, and the window is closing while someone hunts the facts and the person allowed to say yes.', 'A junior hitting send.'],
  ['Media', 'The spend is in the platform and the reason for the spend lives only in memory.', 'Scaling the buy, or a third name for the same dollar.'],
  ['People', "A decision is drafted and the policy it depends on isn't on the page.", 'Sending it on a stale rule.'],
  ['Handoff', 'The work is ready and nobody has accepted the handoff, so the work sits between teams.', 'Counting a chat message as a handoff.'],
] as const;

export default function OfferPage() {
  return (
    <article className="offer">
      <p className="kicker">Erik H Bush · TransformBy10X</p>
      <h1>The client asked where the approval stands.</h1>
      <p className="benefit">
        Someone is rebuilding that answer from chat threads, email, and memory. The purchase to refuse is
        another project tool, or a coordinator hired to own status.
      </p>
      <p className="lede">
        Twenty years in marketing operations and project management. The last three, building with
        AI on the crew. No client result is published yet. This page won’t
        invent one.{' '}
        <a href="https://erikhbush.com/story">Operating history.</a>{' '}
        <a href="https://www.linkedin.com/in/erik-h-bush/">LinkedIn.</a>
      </p>
      <div className="actions">
        <a className="button" href={BOOKING_MAILTO}>
          Talk through the pattern
        </a>
        <Link className="button ghost" href="/map">
          Start PROOF
        </Link>
      </div>

      <section className="sequence">
        <h2>What the conversation includes</h2>
        <p className="lede">
          Ninety minutes with me. Not a tour of the company. Not me watching the team. The session covers
          one function and its last week of work, and ends with a record.
        </p>
        <ol>
          <li>
            <span>Bring</span>
            <strong>Four numbers</strong>
            How many items moved. How many had no current file, no named approver, or no written
            decision. Minutes to reconstruct one. Hours that function actually had.
          </li>
          <li>
            <span>Leave with</span>
            <strong>One record</strong>
            Those hours, and a yes or a no. If the change costs more hours than it returns, the record says
            leave the work as it is. That decision is the product.
          </li>
          <li>
            <span>Not included</span>
            <strong>A revenue promise</strong>
            The count doesn't prove the P&amp;L moved. It prices one hunt against the purchase
            already planned.
          </li>
        </ol>
      </section>

      <section className="sequence">
        <h2>Each hunt, and the purchase it usually leads to</h2>
        <ol>
          {HUNTS.map(([name, hunt, purchase]) => (
            <li key={name}>
              <span>{name}</span>
              <strong>{hunt}</strong>
              Refuse: {purchase}
            </li>
          ))}
        </ol>
      </section>

      <section className="sequence">
        <h2>The order of the money</h2>
        <ol>
          <li>
            <strong>PROOF</strong>
            15 answers. A profile and an hour band. A suggestion, not a measurement.
          </li>
          <li>
            <strong>The conversation</strong>
            The ninety minutes above. Account, creative, production, public relations, or media are
            the five I will book first.
          </li>
          <li>
            <strong>Install</strong>
            Two weeks putting the file, the written decision, the check, and the owner where the
            next person can use them. Only after the numbers say the hours come back.
          </li>
          <li>
            <strong>Quarter-later count</strong>
            The same function, one quarter later. New counts show whether the hours came back.
          </li>
        </ol>
        <div className="actions">
          <a className="button" href={BOOKING_MAILTO}>
            Talk through the pattern
          </a>
          <Link className="button ghost" href="/visualizer?desk=ACC">
            See the account sample
          </Link>
        </div>
      </section>
    </article>
  );
}
