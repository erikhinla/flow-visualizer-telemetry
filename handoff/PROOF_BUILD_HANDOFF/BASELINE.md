# Baseline verification of the captured engine

The captured source was checked on September 27, 2026, in the separate `source/` snapshot. The original engine checkout was not modified. The snapshot includes its relevant uncommitted edits.

Environment: macOS `Darwin x86_64`, Node `v24.18.0`, npm `11.16.0`.

| Step | Result | Evidence |
| --- | --- | --- |
| `npm ci --no-audit --no-fund` | Passed, exit 0 | Exact `package-lock.json` installed without a lockfile change. `dependency-install.log` is empty because npm produced no stdout or stderr. |
| `npm run type-check` through `npm run check` | Passed | `baseline-check.log` |
| `vitest run` through `npm run check` | Passed, 6 files and 40 tests | `baseline-check.log` |
| `next build` through `npm run check` | Passed, static `/` and `/_not-found` | `baseline-check.log` |

The single `npm run check` completed with exit 0. No existing test failure or missing environment requirement was observed in this copied baseline. The source manifest's 48 hashed files were rechecked after the run and remained unchanged. Generated `node_modules/`, `.next/` and TypeScript build cache are excluded from the Git handoff; `npm ci` recreates dependencies.

This verifies the inspected FLOW engine baseline only. It does not establish that the PROOF standalone app exists, that the proposed case schema or Trace metrics work, or that any browser flow has passed. Historical tests can pass while their public copy and artistic scenario remain prohibited by the approved PROOF specification.
