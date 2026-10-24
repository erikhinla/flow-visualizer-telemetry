import Link from 'next/link';

export default function NotFound() {
  return (
    <article className="offer">
      <p className="kicker">PROOF</p>
      <h1>This page isn’t here.</h1>
      <p className="lede">PROOF is 15 answers. Start there, or open the team model.</p>
      <div className="actions">
        <Link className="button" href="/">
          Start PROOF
        </Link>
        <Link className="button ghost" href="/visualizer">
          Desk model
        </Link>
      </div>
    </article>
  );
}
