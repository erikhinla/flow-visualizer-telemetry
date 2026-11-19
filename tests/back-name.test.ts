import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { TEMPLATES } from '../src/lib/mail-templates';

const root = path.join(__dirname, '..');
// The one allowed mention spells out what BACK stands for.
const strip = (s: string) => s.replace(/\(Business Aligned Context Keystones\)/g, '');

test('BACK name: buyer emails say BACK, not Context Keystones', () => {
  const ready = TEMPLATES.keystones;
  const out = ready.render({ AGENCY: 'Test Agency', DOWNLOAD_URL: 'https://example.com/d', REBUILD_URL: 'https://example.com/r' });
  assert.equal(ready.subject, 'Your BACK pack is ready');
  assert.ok(out.text.includes('Download your BACK pack'));
  const paid = TEMPLATES.keystones_paid;
  const out2 = paid.render({ INTAKE_URL: 'https://example.com/i' });
  for (const s of [ready.subject, out.text, out.html, paid.subject, out2.text, out2.html]) assert.ok(!/Context Keystones/.test(s), s.slice(0, 80));
});

test('BACK name: the generated pack says BACK, not Context Keystones', () => {
  const out = path.join(mkdtempSync(path.join(tmpdir(), 'ks-name-')), 'pack');
  execFileSync('python3', [path.join(root, 'keystones/generator/generate.py'), '--intake', path.join(root, 'keystones/generator/intake-example.json'), '--out', out], { stdio: 'pipe' });
  const walk = (d: string): string[] => readdirSync(d).flatMap((n) => { const p = path.join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
  const hits = walk(out).filter((f) => !f.includes('__pycache__') && /Context Keystones/.test(strip(readFileSync(f, 'utf8'))));
  assert.deepEqual(hits.map((f) => path.relative(out, f)), []);
  assert.ok(readFileSync(path.join(out, 'README.md'), 'utf8').startsWith('# BACK: '));
});
