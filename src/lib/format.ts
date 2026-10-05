export function formatHours(value: number | null, digits = 1): string {
  if (value === null || !Number.isFinite(value)) return 'Unknown';
  const factor = 10 ** digits;
  const rounded = Math.round(value * factor) / factor;
  return trimNumber(rounded, digits);
}

export function formatPressure(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return 'Unknown';
  return trimNumber(Math.round(value * 1000) / 1000, 3);
}

export function formatSignedHours(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return 'Unknown';
  const text = formatHours(Math.abs(value));
  if (value > 0) return `+${text}`;
  if (value < 0) return `−${text}`;
  return text;
}

/** Unsigned hours, or Unknown with no suffix. */
export function formatHoursUnit(value: number | null, digits = 1): string {
  if (value === null || !Number.isFinite(value)) return 'Unknown';
  return `${formatHours(value, digits)} h`;
}

/** Signed hours, or Unknown with no suffix. */
export function formatSignedHoursUnit(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return 'Unknown';
  return `${formatSignedHours(value)} h`;
}

export function formatWait(hours: number | null): string {
  if (hours === null || !Number.isFinite(hours)) return 'Unknown';
  const minutes = hours * 60;
  if (minutes < 90) return `${Math.round(minutes)} min`;
  return `${formatHours(hours)} h`;
}

/**
 * Commit a typed number.
 * `null` clears the field. `undefined` keeps a draft (a trailing dot, a lone dot, or anything that is not a number).
 * `.5` commits. `1.` does not.
 */
export function commitNumeric(raw: string): number | null | undefined {
  const text = raw.trim();
  if (text === '') return null;
  if (text === '.' || text.endsWith('.')) return undefined;
  if (!/^\d*\.?\d+$/.test(text)) return undefined;
  const value = Number(text);
  return Number.isFinite(value) ? value : undefined;
}

export function formatPercent(share: number | null): string {
  if (share === null || !Number.isFinite(share)) return 'Unknown';
  return `${trimNumber(Math.round(share * 1000) / 10, 1)}%`;
}

export function trimNumber(value: number, digits: number): string {
  const text = value.toFixed(digits);
  if (!text.includes('.')) return text;
  return text.replace(/0+$/, '').replace(/\.$/, '');
}

export function reviewDate(from: Date, days: number): string {
  const next = new Date(from.getTime());
  next.setDate(next.getDate() + days);
  return next.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
