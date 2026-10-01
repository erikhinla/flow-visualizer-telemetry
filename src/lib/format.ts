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

export function formatWait(hours: number | null): string {
  if (hours === null || !Number.isFinite(hours)) return 'No steady wait';
  const minutes = hours * 60;
  if (minutes < 90) return `${Math.round(minutes)} min`;
  return `${formatHours(hours)} h`;
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
