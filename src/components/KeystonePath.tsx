import { deskTrace, factState, type KeystoneId } from '../lib/trace';
import type { BandId, DepartmentId, EvidenceKind } from '../lib/types';

const MARK: Record<KeystoneId, string> = {
  folders: 'M4 8h6l2 2h8v10H4V8z',
  markdown: 'M5 6h14M5 11h10M5 16h12',
  scripts: 'M6 8l4 4-4 4M12 16h6',
  protocols: 'M12 4v4M8 8h8l-1 10H9L8 8z',
};

export function KeystonePath({
  departmentId,
  band,
  repairHours,
  known,
  evidenceKind,
}: {
  departmentId: DepartmentId;
  band: BandId;
  repairHours: number | null;
  known: boolean;
  evidenceKind: EvidenceKind;
}) {
  const trace = deskTrace(departmentId);
  const state = !known || band === 'unknown' ? 'untraced' : factState(band, repairHours);
  const open = known && band !== 'unknown';
  const line = open
    ? state === 'untraced'
      ? "There's work here but no hours to do it. The file, brief, check and owner can still be named."
      : state === 'held'
        ? 'This team is on track. These four steps keep it that way.'
        : 'Four steps that make the status, next step, owner and deadline easy to find.'
    : 'Add hours for this team to see the steps.';

  return (
    <section className="stones" aria-labelledby="stones-title" data-open={open ? 'true' : 'false'}>
      <div className="trace-head">
        <p className="kicker">Context Keystones</p>
        <h2 id="stones-title">Four steps to keep this team on track</h2>
        <p className="state-line">{line}</p>
        {open && evidenceKind === 'simulated' ? (
          <p className="note">These steps use sample numbers.</p>
        ) : null}
      </div>
      <ol className="stone-path">
        {trace.keystones.map((stone, index) => (
          <li key={stone.id} className={open ? 'stone' : 'stone is-locked'}>
            <span className="stone-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="28" height="28">
                <path d={MARK[stone.id]} fill="none" stroke="currentColor" strokeWidth="1.4" />
              </svg>
              {String(index + 1).padStart(2, '0')}
            </span>
            <h3>{stone.name}</h3>
            <p className="holds">
              <span>Covers</span> {stone.holds}
            </p>
            {open ? (
              <p className="stone-action">{stone.action}</p>
            ) : (
              <p className="stone-action locked">Add hours to unlock.</p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
