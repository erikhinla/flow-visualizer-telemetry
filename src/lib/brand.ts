/** PROOF tagline under the wordmark. One variable: swap here, rebuild, every surface follows. Erik picked B on 2026-11-19. */
export const PROOF_TAGLINE = 'Your friction, found in 15 answers.';
/** Header form for a department, e.g. "Production Dept". Body copy and labels use the plain name. */
export const deptHeader = (name: string) => `${name} Dept`;

/** Public dept landing page (outside the /proof/screen base path, so use a plain <a>). */
export const deptPageHref = (name: string) => `/dept/${name.toLowerCase()}/`;
