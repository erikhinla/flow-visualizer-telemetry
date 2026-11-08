import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

/** Fields Next.js accepts from an App Router route.js module. Anything else fails `next build`. */
const ROUTE_EXPORTS = new Set([
  'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'DELETE', 'PATCH',
  'config', 'generateStaticParams', 'revalidate', 'dynamic', 'dynamicParams',
  'fetchCache', 'preferredRegion', 'runtime', 'maxDuration',
]);

function routeFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const file = path.join(dir, name);
    if (statSync(file).isDirectory()) out.push(...routeFiles(file));
    else if (name === 'route.ts' || name === 'route.js') out.push(file);
  }
  return out;
}

function exportNames(source: string): string[] {
  const names: string[] = [];
  const decl = /export\s+(?:async\s+)?(?:function|const|let|var|class|type|interface|enum)\s+([A-Za-z0-9_]+)/g;
  for (let match = decl.exec(source); match; match = decl.exec(source)) names.push(match[1]);
  const brace = /export\s*\{([^}]+)\}/g;
  for (let match = brace.exec(source); match; match = brace.exec(source)) {
    for (const part of match[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/).pop()?.trim();
      if (name) names.push(name);
    }
  }
  return names;
}

test('app routes export only Next.js route fields', () => {
  const files = routeFiles(path.join(process.cwd(), 'src', 'app'));
  const webhook = files.find((file) => file.endsWith(`${path.sep}api${path.sep}stripe${path.sep}webhook${path.sep}route.ts`));
  assert.ok(webhook, 'stripe webhook route is present');
  for (const file of files) {
    const extra = exportNames(readFileSync(file, 'utf8')).filter((name) => !ROUTE_EXPORTS.has(name));
    assert.deepEqual(extra, [], `${path.relative(process.cwd(), file)} exports ${extra.join(', ')}`);
  }
});

test('checkout retrieve seam lives beside the route, not on it', async () => {
  const route = await import('../src/app/api/stripe/webhook/route');
  assert.equal('setCheckoutRetriever' in route, false);
  const seam = await import('../src/lib/keystones-retrieve');
  assert.equal(typeof seam.setCheckoutRetriever, 'function');
  assert.equal(typeof seam.retrieveCheckoutSession, 'function');
  assert.equal(typeof seam.checkoutRetrieveConfigured, 'function');
});
