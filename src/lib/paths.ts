/** Build-time basePath also applies to raw fetch URLs, which Next Link does not manage. */
export const BASE_PATH = process.env.NEXT_PUBLIC_PROOF_BASE_PATH ?? '';
export function appPath(path: string): string {
  return `${BASE_PATH}${path}`;
}
