import Link from 'next/link';

export default function NotFound() {
  return (
    <article className="offer">
      <p className="kicker">PROOF</p>
      <h1>This page is not on the desk.</h1>
      <p className="lede">Scan, Trace, and Record are the three places this site keeps.</p>
      <div className="actions">
        <Link className="button" href="/map">
          Scan
        </Link>
        <Link className="button ghost" href="/visualizer">
          Trace
        </Link>
        <Link className="button ghost" href="/record">
          Record
        </Link>
      </div>
    </article>
  );
}
