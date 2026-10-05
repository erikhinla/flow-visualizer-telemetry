import type { Metadata } from 'next';
import Link from 'next/link';
import { BOOKING_MAILTO, DESK_TRACE_PRICE, KEYSTONE_PRICE, RETRACE_PRICE } from '../../lib/offer';

export const metadata: Metadata = {
  title: 'Trace — Erik H Bush',
  description:
    'Ninety minutes on one function. Your counts. A yes or a no on the fix. No client result is published yet.',
};

const HUNTS = [
  ['Account', 'The client asks where the approval stands and someone rebuilds it from Slack, email, and memory.', 'Another project tool, or a coordinator hired to own status.'],
  ['Finance', 'The invoice is late because the charge cannot be tied to the job that approved it.', 'A new billing system, or writing the invoice off.'],
  ['Legal', 'A version is ready and nobody can show who cleared the rights.', 'Shipping it unsigned, or another reviewer hired to hunt.'],
  ['Production', 'Delivery is waiting on the one person who remembers which file is the master.', 'Another asset library.'],
  ['Strategy', 'The room is full of decks and nobody has said what the decision is.', 'Another workshop, or an AI summary of the pile.'],
  ['Creative', 'The piece is done and the notes are in five threads, so the next round starts over.', 'Billing the client for that round again.'],
  ['Public relations', 'The statement can still go out, and the window is closing while someone hunts the facts and the person allowed to say yes.', 'A junior hitting send.'],
  ['Media', 'The spend is in the platform and the reason for it is in someone’s head.', 'Scaling the buy, or a third name for the same dollar.'],
  ['People', 'A decision is drafted and the policy it depends on is not on the page.', 'Sending it on a stale rule.'],
  ['Handoff', 'The job is ready and nobody has accepted it, so it sits between teams.', 'Counting a Slack ping as a handoff.'],
] as const;

export default function OfferPage() {
  return (
    <article className="offer">
      <p className="kicker">Erik H Bush · TransformBy10X</p>
      <h1>The client asked where the approval stands.</h1>
      <p className="benefit">
        Someone is rebuilding that answer from Slack, email, and memory. The purchase to refuse is
        another project tool, or a coordinator hired to own status.
      </p>
      <p className="lede">
        Twenty years in marketing operations and project management. The last three, building with
        AI on the crew. A client has not published a result from this trace. This page will not
        invent one.{' '}
        <a href="https://erikhbush.com/story">Operating history.</a>{' '}
        <a href="https://www.linkedin.com/in/erik-h-bush/">LinkedIn.</a>
      </p>
      <div className="actions">
        <a className="button" href={BOOKING_MAILTO}>
          Book the trace — {DESK_TRACE_PRICE}
        </a>
        <Link className="button ghost" href="/map">
          Scan the agency
        </Link>
      </div>

      <section className="sequence">
        <h2>What the {DESK_TRACE_PRICE} buys</h2>
        <p className="lede">
          Ninety minutes with me. Not a tour of the company. Not me watching the team. You bring
          one function’s last week, and you leave with a record.
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
            Those hours, and a yes or a no. If the fix costs more than it returns, the record says
            leave it alone. That decision is the product.
          </li>
          <li>
            <span>Not included</span>
            <strong>A revenue promise</strong>
            The count does not prove the P&amp;L moved. It prices one hunt against the purchase you
            were about to make.
          </li>
        </ol>
      </section>

      <section className="sequence">
        <h2>The hunt, and the purchase it is there to stop</h2>
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
            <span>Free</span>
            <strong>Scan</strong>
            Fifteen questions. A profile and an hour band. A suggestion, not a measurement.
          </li>
          <li>
            <span>{DESK_TRACE_PRICE}</span>
            <strong>Trace</strong>
            The ninety minutes above. Account, creative, production, public relations, or media are
            the five I will book first.
          </li>
          <li>
            <span>{KEYSTONE_PRICE}</span>
            <strong>Install</strong>
            Two weeks putting the file, the written decision, the check, and the owner where the
            next person can use them. Only after the trace says the hours come back.
          </li>
          <li>
            <span>{RETRACE_PRICE}</span>
            <strong>Re-trace</strong>
            The same function, one quarter later. New counts. The window opened, or it did not.
          </li>
        </ol>
        <div className="actions">
          <a className="button" href={BOOKING_MAILTO}>
            Book the trace — {DESK_TRACE_PRICE}
          </a>
          <Link className="button ghost" href="/visualizer?desk=ACC">
            See the account sample
          </Link>
        </div>
      </section>
    </article>
  );
}
