// Date checks shared by the Keystones intake page and its API route. Same rules as the pack's scripts.
export const DATE_EXAMPLE = '2026-11-14';

/** Returns a plain-words problem, or '' when the value is blank or a real YYYY-MM-DD date. */
export function dateProblem(raw: string | undefined): string {
  const s = (raw ?? '').trim();
  if (!s || s.toUpperCase() === 'TBC') return '';
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (!m) return `That isn't a date this can read. Type it like ${DATE_EXAMPLE} (year-month-day).`;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return `That date doesn't exist. Try it like ${DATE_EXAMPLE}.`;
  return '';
}

export function isPast(raw: string | undefined, today = new Date()): boolean {
  const s = (raw ?? '').trim();
  if (!s || dateProblem(s)) return false;
  const t = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [y, mo, d] = s.split('-').map(Number);
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}` < t;
}

/** Problems with a first project's dates, keyed by field. Empty object when all is well. */
export function firstProjectProblems(fp: { due?: string; flight_start?: string; flight_end?: string } | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!fp) return out;
  for (const k of ['due', 'flight_start', 'flight_end'] as const) {
    const p = dateProblem(fp[k]);
    if (p) out[k] = p;
  }
  const norm = (s: string) => s.trim().split('-').map((x, i) => (i ? x.padStart(2, '0') : x)).join('-');
  if (!out.flight_start && !out.flight_end && fp.flight_start?.trim() && fp.flight_end?.trim() && norm(fp.flight_end) < norm(fp.flight_start)) {
    out.flight_end = "The flight can't end before it starts.";
  }
  return out;
}
