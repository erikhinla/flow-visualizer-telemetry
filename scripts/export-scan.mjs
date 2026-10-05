import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';

// Same source consumed by the instrument, packaged for the film's browser code.
await build({
  entryPoints: ['src/lib/scan-contract.ts'],
  outfile: 'public/proof-scan.mjs',
  bundle: true,
  platform: 'browser',
  format: 'esm',
  target: 'es2020',
  banner: { js: '// Generated from src/lib/scan-contract.ts. Run npm run export:scan; do not edit.' },
});
const { QUESTIONS, MAP_MODEL_VERSION } = await import(`../public/proof-scan.mjs?build=${Date.now()}`);
await writeFile('public/proof-scan-contract.json', JSON.stringify({
  version: MAP_MODEL_VERSION,
  questions: QUESTIONS,
  bands: [
    { id: 'FRAGMENTED', min: 0, max: 7 },
    { id: 'STALLED', min: 8, max: 14 },
    { id: 'SCALING', min: 15, max: 22 },
    { id: 'COMPOUNDING', min: 23, max: 30 },
  ],
}, null, 2) + '\n');
// Verify the generated JSON corresponds to the exported source.
const json = JSON.parse(await readFile('public/proof-scan-contract.json', 'utf8'));
if (JSON.stringify(json.questions) !== JSON.stringify(QUESTIONS)) throw new Error('Contract mismatch');
