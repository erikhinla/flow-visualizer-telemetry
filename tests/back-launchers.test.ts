import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { TEMPLATES } from '../src/lib/mail-templates';

const root = path.join(__dirname, '..');
const build = () => {
  const out = path.join(mkdtempSync(path.join(tmpdir(), 'ks-launch-')), 'pack');
  execFileSync('python3', [path.join(root, 'keystones/generator/generate.py'), '--intake', path.join(root, 'keystones/generator/intake-example.json'), '--out', out], { stdio: 'pipe' });
  return out;
};
const walk = (d: string): string[] => readdirSync(d).flatMap((n) => { const p = path.join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });

test('BACK launchers: named Start BACK, say "Opens the BACK menu", old names gone', () => {
  const out = build();
  for (const f of ['Start BACK (Mac).command', 'Start BACK (Windows).bat', 'start-back-linux.sh']) {
    assert.ok(existsSync(path.join(out, f)), f);
    assert.ok(readFileSync(path.join(out, f), 'utf8').includes('Opens the BACK menu'), f);
  }
  for (const f of ['Start Keystones (Mac).command', 'Start Keystones (Windows).bat', 'start-keystones-linux.sh']) assert.ok(!existsSync(path.join(out, f)), f);
  const old = walk(out).filter((f) => !f.includes('__pycache__') && /Start Keystones|start-keystones/i.test(readFileSync(f, 'utf8')));
  assert.deepEqual(old.map((f) => path.relative(out, f)), []);
  const start = readFileSync(path.join(out, 'START HERE.md'), 'utf8');
  for (const f of ['Start BACK (Mac).command', 'Start BACK (Windows).bat', 'start-back-linux.sh']) assert.ok(start.includes(f), f);
});

test('BACK launchers: intake wording fills the first project only, the template stays blank', () => {
  const out = build();
  const [sample] = readdirSync(path.join(out, 'projects')).filter((n) => n !== '__pycache__');
  const m = readFileSync(path.join(out, 'projects', sample, '_context', 'mandatories.md'), 'utf8');
  const l = readFileSync(path.join(out, 'projects', sample, '_context', 'legal-lines.md'), 'utf8');
  assert.ok(m.includes('Built for the long haul.') && !m.includes('{{'.concat('CLIENT}}')) && !m.includes('{{CREATED}}'));
  assert.ok(l.includes('Professional athlete. Do not attempt.') && !l.includes('{{CREATED}}'));
  const tm = readFileSync(path.join(out, 'project-template', '_context', 'mandatories.md'), 'utf8');
  const tl = readFileSync(path.join(out, 'project-template', '_context', 'legal-lines.md'), 'utf8');
  assert.ok(!tm.includes('Built for the long haul.') && tm.includes('(current value)'));
  assert.ok(!tl.includes('Professional athlete.') && tl.includes('(approved wording)'));
});

test('BACK launchers: internal template names say BACK', () => {
  for (const k of ['keystones', 'keystones_paid', 'keystones_cap_erik'] as const) assert.ok(!/Keystones/.test(TEMPLATES[k].name), TEMPLATES[k].name);
});
