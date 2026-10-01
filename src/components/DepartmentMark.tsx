import type { DepartmentId } from '../lib/types';

export function DepartmentMark({ id, accent }: { id: DepartmentId; accent: string }) {
  return (
    <svg className="mark" viewBox="0 0 32 32" aria-hidden="true">
      <Mark id={id} accent={accent} />
    </svg>
  );
}

function Mark({ id, accent }: { id: DepartmentId; accent: string }) {
  const ink = '#f4efe6';
  if (id === 'ACC') {
    return (
      <>
        <path
          d="M6 8h6M6 8v16M6 24h6M26 8h-6M26 8v16M26 24h-6"
          stroke={accent}
          strokeWidth="1.6"
          fill="none"
        />
        <path d="M12 16h8" stroke={ink} strokeWidth="1.4" />
      </>
    );
  }
  if (id === 'FIN') {
    return (
      <>
        <path d="M7 20h14M11 12h14" stroke={accent} strokeWidth="1.6" fill="none" />
        <path d="M21 12v8M11 12v8" stroke={ink} strokeWidth="1.2" />
      </>
    );
  }
  if (id === 'LGL') {
    return (
      <>
        <circle cx="8" cy="16" r="2.2" fill="none" stroke={ink} />
        <circle cx="16" cy="16" r="2.2" fill="none" stroke={ink} />
        <circle cx="24" cy="16" r="2.2" fill="none" stroke={accent} />
        <path d="M10.2 16h3.6M18.2 16h1.2" stroke={accent} strokeWidth="1.4" />
      </>
    );
  }
  if (id === 'PRD') {
    return (
      <>
        <rect x="8" y="18" width="16" height="5" fill="none" stroke={ink} />
        <rect x="10" y="13" width="14" height="5" fill="none" stroke={ink} />
        <rect x="12" y="8" width="12" height="5" fill="none" stroke={accent} />
      </>
    );
  }
  if (id === 'STR') {
    return (
      <>
        <path d="M6 8h20L18 16l8 8H6" fill="none" stroke={accent} strokeWidth="1.4" />
        <path d="M16 12v8" stroke={ink} strokeWidth="1.4" />
      </>
    );
  }
  if (id === 'CRT') {
    return (
      <>
        <path d="M16 6v20M8 10l16 12M24 10L8 22" stroke={accent} strokeWidth="1.3" />
        <circle cx="16" cy="16" r="1.6" fill={ink} />
      </>
    );
  }
  if (id === 'PR') {
    return (
      <>
        <path d="M4 16h8l3-6 4 12 3-6h6" fill="none" stroke={accent} strokeWidth="1.5" />
        <path d="M20 7v18" stroke={ink} strokeWidth="1.3" />
      </>
    );
  }
  if (id === 'MED') {
    return (
      <>
        <circle cx="20" cy="14" r="6" fill="none" stroke={accent} />
        <path d="M20 14h6M6 22l8-6" stroke={ink} strokeWidth="1.4" />
      </>
    );
  }
  if (id === 'HR') {
    return (
      <>
        <path
          d="M7 8h5M7 8v16M7 24h5M25 8h-5M25 8v16M25 24h-5"
          fill="none"
          stroke={accent}
          strokeWidth="1.5"
        />
        <circle cx="16" cy="13" r="2" fill={ink} />
        <path d="M12.5 21c.8-2.4 2-3.4 3.5-3.4S18.7 18.6 19.5 21" fill="none" stroke={ink} />
      </>
    );
  }
  return (
    <>
      <rect x="4" y="12" width="8" height="8" fill="none" stroke={ink} />
      <rect x="20" y="12" width="8" height="8" fill="none" stroke={ink} />
      <path d="M12 16h3M17 16h3" stroke={accent} strokeWidth="1.4" />
      <circle cx="16" cy="16" r="1.5" fill={accent} />
    </>
  );
}
