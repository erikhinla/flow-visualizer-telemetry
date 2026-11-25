import { appPath } from './paths';

/** Click counting for the results view. Always on, allowlisted fields only, no identifiers. */
const VISIT_KEY = 'tbtx.visit.v1';
const TAG_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'via'] as const;
export type TagKey = (typeof TAG_KEYS)[number];
export type VisitTags = Partial<Record<TagKey, string>>;
export type ClickName = 'review_click' | 'review_click_quiet' | 'fact_click' | 'back_click';

/**
 * Tags are read once per visit and kept in sessionStorage, because the diagnostic is a single page
 * and the booking click can land several screens after the tagged entry URL is gone from the bar.
 */
export function visitTags(): VisitTags {
  if (typeof window === 'undefined') return {};
  let stored: VisitTags = {};
  try {
    const raw = window.sessionStorage.getItem(VISIT_KEY);
    if (raw) stored = JSON.parse(raw) as VisitTags;
  } catch {
    stored = {};
  }
  const live: VisitTags = {};
  try {
    const params = new URLSearchParams(window.location.search);
    for (const key of TAG_KEYS) {
      const value = params.get(key);
      if (value) live[key] = value.slice(0, 120);
    }
  } catch {
    /* malformed search string */
  }
  const merged: VisitTags = { ...stored, ...live };
  if (Object.keys(live).length || !Object.keys(stored).length) {
    try {
      window.sessionStorage.setItem(VISIT_KEY, JSON.stringify(merged));
    } catch {
      /* private mode: tags still work for this call */
    }
  }
  return merged;
}

/** Fire and forget. A tracking failure must never delay or block the click. */
export function trackClick(event: ClickName): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const tags = visitTags();
  const body = JSON.stringify({
    events: [{ event, time: new Date().toISOString(), page: window.location.pathname, ...tags }]
  });
  const url = appPath('/api/track');
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const queued = navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
      if (queued) return;
    }
  } catch {
    /* fall through to fetch */
  }
  if (typeof fetch === 'function') {
    void fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      keepalive: true
    }).catch(() => undefined);
  }
}
