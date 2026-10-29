import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, cp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkKnowledge } from './kb-check.mjs';

const original = fileURLToPath(new URL('../', import.meta.url));
async function fixture(run) {
  const root = await mkdtemp(join(tmpdir(), 'mega-kb-check-'));
  try {
    for (const path of ['src', 'knowledge', 'inbox', 'rendered', 'scripts', 'package.json', 'package-lock.json', 'vite.config.js']) await cp(join(original, path), join(root, path), { recursive: true });
    await run(root);
  } finally { await rm(root, { recursive: true, force: true }); }
}
test('current reviewed snapshot is healthy and publication stays explicit', async () => fixture(async (root) => {
  const result = await checkKnowledge(root, { asOf: '2026-10-28' });
  assert.deepEqual(result.errors, []);
  const path = join(root, 'knowledge/work.json');
  const work = JSON.parse(await readFile(path, 'utf8'));
  work.publication.status = 'not-published';
  work.publication.verified_on = null;
  await writeFile(path, JSON.stringify(work));
  const draft = await checkKnowledge(root, { asOf: '2026-10-28' });
  assert(draft.warnings.some((item) => item.code === 'publication-pending'));
}));
test('a changed report invalidates evidence review and rendered output', async () => fixture(async (root) => {
  const path = join(root, 'src/lib/data/reports-4471.json');
  const reports = JSON.parse(await readFile(path, 'utf8'));
  reports[0].body += ' Updated evidence.';
  await writeFile(path, JSON.stringify(reports));
  const result = await checkKnowledge(root, { asOf: '2026-10-28' });
  assert(result.errors.some((item) => item.code === 'source-changed'));
  assert(result.errors.some((item) => item.code === 'render-stale'));
}));
test('an unsigned page and unfiled intake are surfaced', async () => fixture(async (root) => {
  const path = join(root, 'src/routes/kb/incidents/4471-review/+page.svx');
  await writeFile(path, (await readFile(path, 'utf8')).replace(/^signature:.*\n/m, ''));
  await writeFile(join(root, 'inbox/new.json'), JSON.stringify({ id: 'new-report', type: 'correction', status: 'pending', source_set: '4471-export', source: 'src/lib/data/reports-4471.json', received_on: '2026-10-28', summary: 'Needs review', filed_in: [] }));
  const result = await checkKnowledge(root, { asOf: '2026-10-28' });
  assert(result.errors.some((item) => item.code === 'missing-metadata' && item.message === 'Missing signature'));
  assert(result.warnings.some((item) => item.code === 'inbox-pending'));
}));
