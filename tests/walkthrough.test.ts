import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import WALKTHROUGH from '../keystones/walkthrough.json';
import { BACK_WALKTHROUGH_URL } from '../src/lib/walkthrough';
import { TEMPLATES } from '../src/lib/mail-templates';

const root = path.join(__dirname, '..');

test('walkthrough: empty link hides the video line in the email', () => {
  if (WALKTHROUGH.url) return; // only meaningful while the link is off
  assert.equal(BACK_WALKTHROUGH_URL, '');
  const out = JSON.stringify(TEMPLATES.keystones.render({ AGENCY: 'Test Agency', DOWNLOAD_URL: 'https://example.com/d', REBUILD_URL: 'https://example.com/r' }));
  assert.ok(out.includes('START HERE.md'));
  assert.ok(!/VIDEO_LINK|walkthrough/i.test(out));
});

test('walkthrough: pack has START HERE.md at the root and no video placeholder', () => {
  if (WALKTHROUGH.url) return;
  const out = path.join(mkdtempSync(path.join(tmpdir(), 'ks-walk-')), 'pack');
  execFileSync('python3', [path.join(root, 'keystones/generator/generate.py'), '--intake', path.join(root, 'keystones/generator/intake-example.json'), '--out', out], { stdio: 'pipe' });
  assert.ok(existsSync(path.join(out, 'START HERE.md')));
  for (const f of ['START HERE.md', 'README.md']) {
    const text = readFileSync(path.join(out, f), 'utf8');
    assert.ok(!/VIDEO_LINK|walkthrough/i.test(text), f);
  }
  assert.ok(readFileSync(path.join(out, 'README.md'), 'utf8').includes('START HERE.md'));
});
