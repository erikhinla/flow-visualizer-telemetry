# PROOF standalone app: reproducible build handoff

This package is the source and decision handoff for a future build. The `source/` directory is a byte-checked snapshot of the inspected local engine, including its relevant uncommitted changes. It is an existing FLOW visualizer, not the completed PROOF app. Build PROOF in a separate checkout or project. Leave the original engine untouched.

## What is here

- `reference/PROOF_STANDALONE_BUILD_SPEC.md`: approved release behavior and acceptance criteria.
- `reference/Global_TBTX_BBAI_BBM_GUIDE_retrieved.txt` and `reference/PROOF_CREATIVE_SYSTEM_retrieved.txt`: retrieved source snapshots used to resolve naming and evidence boundaries. Their current online versions may change.
- `source/`: exact inspected source tree. This includes `package-lock.json`, six locally bundled Barlow font files, `src/app/fonts/OFL.txt`, two design reference images, current tests and decision log. It excludes `.DS_Store`, dependencies, build caches and credentials.
- `source/CURRENT_WORKTREE_DIFF.patch`: tracked changes relative to the recorded Git commit. Four relevant untracked files are listed in `MANIFEST.json` and included directly under `source/`.
- `MANIFEST.json`: commit, branch, tree hash, modified and included files, source links and SHA-256 hashes. This is a record of the snapshot, not proof that its formulas are scientifically valid.
- `BASELINE.md`: the single baseline run and its limits. `dependency-install.log` and `baseline-check.log` are the command outputs.
- `FIXTURE_PRECEDENCE.md`: which rules govern product behavior and which remain historical regression material.

## Environment and reproduction

The observed audit machine was macOS `Darwin x86_64` with Node `v24.18.0` and npm `11.16.0`. The source does not declare a Node engine requirement. Use those observed versions to reproduce this run. `package-lock.json` pins the dependency tree; `npm ci` installs it without changing the lockfile. No credentials or environment variables are required for the baseline source.

From `source/`:

```sh
npm ci --no-audit --no-fund
npm run check
npm run dev
```

Open `http://localhost:3000` only after the development server reports that it started. `npm run check` runs strict TypeScript checking, Vitest and a Next.js production build. It is a source baseline, not PROOF browser acceptance. The implementation environment should run the same command after the standalone changes, then verify the full browser path separately.

The source's `.gitignore` already excludes dependencies and `.next`; this package does not include either. Font assets and their OFL license stay together. The two design reference images are reference material, not approved PROOF brand art.

## Resume

1. Verify `MANIFEST.json` hashes and the baseline result in `BASELINE.md`.
2. Read `FIXTURE_PRECEDENCE.md`, then the main specification. Consult an appendix only for the behavior being implemented.
3. Create a clean, separate PROOF working directory from `source/`. Preserve its original snapshot as the baseline. Record any package or lockfile changes.
4. Implement optional Map entry, manual one-task tracing, evidence-aware calculations, six fixed readout sections, memory-only case state and explicit JSON import/export.
5. Run the spec's acceptance tests and browser flow. Report local check, browser, push and deployment status separately. Stop at the browser-verified local app; no deployment is part of this handoff.

The exact next implementation step is to create the separate PROOF project from this snapshot, remove historical scenario imports from the product path, and add the versioned case schema and in-memory case store before building the tracing UI. Historical tests remain available without exposing their formulas in the browser bundle.
