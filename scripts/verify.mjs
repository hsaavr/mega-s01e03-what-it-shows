import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { createServer } from 'vite';

const evidence = JSON.parse(await readFile('evidence/report-audit.json', 'utf8'));
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const pageLogic = await server.ssrLoadModule('/src/lib/kb/report-audit.ts');
  assert.equal(evidence.totals.uniqueReportIds, 412);
  assert.equal(evidence.totals.inputRows, 427);
  assert.equal(evidence.totals.duplicateExtraRows, 15);
  assert.deepEqual(evidence.totals.coverageCounts, { parser: 379, hint: 33, 'one-day': 5, unplaced: 0 });
  const ids = evidence.groups.flatMap((g) => g.ids);
  assert.equal(ids.length, 417, 'Issue coverage includes five overlapping symptom flags');
  assert.equal(new Set(ids).size, 412, 'Coverage union must retain exactly 412 distinct report IDs');
  const parserIds = new Set(evidence.groups.find((g) => g.cause === 'parser').ids);
  const flags = evidence.groups.find((g) => g.cause === 'one-day').ids;
  assert.equal(flags.filter((id) => parserIds.has(id)).length, 5, 'All one-day flags remain inside exported parser filing');
  assert.equal(evidence.groups.find((g) => g.cause === 'hint').ids.filter((id) => parserIds.has(id)).length, 0);
  for (const group of pageLogic.groups) {
    const independent = evidence.groups.find((g) => g.cause === group.problem);
    assert.deepEqual(group.rows.map((r) => r.id).sort(), independent.ids.toSorted(), group.problem);
  }
  assert.equal(pageLogic.audit.misleadingTags, evidence.totals.intakeTagDisagreementCount);
  assert.equal(pageLogic.audit.mergedOnJuly2, 184);
  assert.deepEqual(pageLogic.backlogWeek, { at: '2026-06-29', received: 15, merged: 189 });
  const html = await readFile('rendered/kb/incidents/4471-review/index.html', 'utf8');
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
  assert.match(text, /412 distinct reports/);
  assert.match(text, /379/);
  assert.match(text, /33/);
  assert.match(text, /5/);
  const page = await server.ssrLoadModule('/src/routes/kb/incidents/4471-review/+page.svx');
  const { deskRef } = await server.ssrLoadModule('/src/lib/kb/desk-ref.ts');
  assert.match(page.metadata.signature, /^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/, 'Use the exact course-issued ticket as the signature');
  assert(text.includes(deskRef(page.metadata.signature)), 'Rendered ref must match the course-issued signature');
  assert.doesNotMatch(text, /no desk ref|undefined|NaN/);
  assert.equal((html.match(/<rect\b/g) || []).length, 54, '27 received and 27 merge bars');
  assert.equal(createHash('sha256').update(await readFile('src/routes/kb/decisions/0001-dedupe-by-subject/+page.svx')).digest('hex'), '41ac5460f198519b61b72c1a344a89fc3f9c26eda481ad85d710fa23f336a1c9', 'Accepted decision must remain unchanged');
  async function walk(dir) {
    for (const item of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, item.name);
      if (item.isDirectory()) await walk(path);
      else if (item.name.endsWith('.html')) {
        const document = await readFile(path, 'utf8');
        for (const [, href] of document.matchAll(/href="(\/kb[^"#?]*)"/g)) {
          await access(join('rendered', href, 'index.html'));
        }
      }
    }
  }
  await walk('rendered');
  console.log('Verified exported filing membership, distinct coverage union and flagged overlap, rendered counts, 54 chart bars, desk ref, internal links, and preserved decision.');
} finally {
  await server.close();
}
