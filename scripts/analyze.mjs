import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

// Run from any directory: node /path/to/repo/scripts/analyze.mjs
// No external requests or source modifications. Requires Node's built-in Intl.
const root = new URL('../', import.meta.url);
const dataRoot = new URL('src/lib/data/', root);
const readJson = async (url) => JSON.parse(await readFile(url, 'utf8'));
const reportUrl = new URL('reports-4471.json', dataRoot);
const reportText = await readFile(reportUrl, 'utf8');
const input = JSON.parse(reportText);
const deskNotes = await readJson(new URL('desk-notes.json', dataRoot));
const oneDayIds = new Set(deskNotes.oneDayMove);
const tenants = new Map();
for (const name of (await readdir(new URL('tenants/', dataRoot))).filter((name) => name.endsWith('.json')).sort()) {
  const tenant = await readJson(new URL(`tenants/${name}`, dataRoot));
  assert(!tenants.has(tenant.handle), `Duplicate tenant: ${tenant.handle}`);
  tenants.set(tenant.handle, tenant);
}

function dayFirst(locale) {
  const parts = new Intl.DateTimeFormat(locale, {
    day: '2-digit', month: '2-digit', year: 'numeric'
  }).formatToParts(new Date(Date.UTC(2026, 10, 22)));
  return parts.findIndex((part) => part.type === 'day') < parts.findIndex((part) => part.type === 'month');
}
const tenantDateOrder = [...tenants.values()].map((tenant) => ({
  ...tenant, dayFirst: dayFirst(tenant.locale)
}));
const tenantDayFirst = new Map(tenantDateOrder.map((tenant) => [tenant.handle, tenant.dayFirst]));

function coarseCause(report) {
  const tenant = tenants.get(report.tenant);
  if (!tenant || !tenantDayFirst.get(report.tenant)) return 'unplaced';
  return report.channel === 'form' && tenant.form === 'booking-v3' ? 'hint' : 'parser';
}
function cause(report) {
  return coarseCause(report);
}
function inGroup(report, key) {
  return key === 'one-day' ? oneDayIds.has(report.id) : cause(report) === key;
}
const unique = new Map();
const occurrences = new Map();
for (const report of input) {
  if (unique.has(report.id)) {
    assert.deepEqual(report, unique.get(report.id), `Conflicting copies for ${report.id}; deduplication needs review`);
  } else unique.set(report.id, report);
  occurrences.set(report.id, (occurrences.get(report.id) ?? 0) + 1);
}
const reports = [...unique.values()];
for (const id of oneDayIds) assert(unique.has(id), `Desk note points to missing report ${id}`);
const idLines = new Map();
reportText.split('\n').forEach((line, index) => {
  const match = line.match(/"id": "([^"]+)"/);
  if (match) idLines.set(match[1], [...(idLines.get(match[1]) ?? []), index + 1]);
});
const causes = ['parser', 'hint', 'one-day', 'unplaced'];
function tally(items, classify = cause) {
  const result = Object.fromEntries(causes.map((key) => [key, 0]));
  for (const item of items) result[classify(item)]++;
  return result;
}
function earliest(items, field = 'receivedAt') {
  return items.length ? items.reduce((a, b) => Date.parse(a[field]) < Date.parse(b[field]) ? a : b)[field] : null;
}
function latest(items, field = 'receivedAt') {
  return items.length ? items.reduce((a, b) => Date.parse(a[field]) > Date.parse(b[field]) ? a : b)[field] : null;
}
function weekStart(iso) {
  // Preserve the timestamp's written local calendar date; avoid host timezone.
  const date = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
  return date.toISOString().slice(0, 10);
}
const months = 'January February March April May June July August September October November December'.split(' ');
const datePattern = new RegExp(`\\b(\\d{1,2}) (${months.join('|')})\\b`, 'g');
function explicitTranspose(report) {
  const dates = [...report.body.matchAll(datePattern)].map((match) => [Number(match[1]), months.indexOf(match[2]) + 1]);
  return dates.length === 2 && dates[0][0] === dates[1][1] && dates[0][1] === dates[1][0];
}
function representative(report) {
  const tenant = tenants.get(report.tenant);
  return {
    id: report.id, tenant: report.tenant, channel: report.channel,
    tenantLocale: tenant?.locale ?? null, formVersion: tenant?.form ?? null,
    browserLocale: report.meta.browserLocale, intakeTag: report.meta.intakeTag,
    cause: cause(report), oneDayFlag: oneDayIds.has(report.id), receivedAt: report.receivedAt,
    explicitTranspose: explicitTranspose(report),
    source: 'src/lib/data/reports-4471.json', idLines: idLines.get(report.id),
    bodyLines: idLines.get(report.id).map((line) => line + 5), body: report.body
  };
}
const selected = {
  parser: ['R-41200', 'R-41205', 'R-41292', 'R-41370', 'R-41424', 'R-41615'],
  hint: ['R-41230', 'R-41241', 'R-41251', 'R-41449'],
  'one-day': [...oneDayIds], unplaced: []
};
const groups = causes.map((key) => {
  const items = reports.filter((report) => inGroup(report, key));
  const handles = [...new Set(items.map((report) => report.tenant))].sort();
  return {
    cause: key,
    label: key === 'one-day' ? 'Desk one-day symptom flag (overlapping subset)' : `${key} desk filing`,
    count: items.length, rawCount: input.filter((report) => inGroup(report, key)).length,
    ids: items.map((report) => report.id),
    tenants: handles.map((handle) => ({ ...tenants.get(handle), count: items.filter((report) => report.tenant === handle).length })),
    firstSeen: earliest(items), lastSeen: latest(items),
    explicitTransposeCount: items.filter(explicitTranspose).length,
    weakerBodyEvidenceIds: items.filter((report) => !explicitTranspose(report)).map((report) => report.id),
    representatives: selected[key].map((id) => unique.get(id)).filter(Boolean).map(representative)
  };
});
function cohorts(field, keyFn) {
  const keys = [...new Set(reports.map((report) => keyFn(report[field])))].sort();
  return keys.map((key) => {
    const items = reports.filter((report) => keyFn(report[field]) === key);
    return { cohort: key, ...tally(items), oneDayFlag: items.filter((report) => oneDayIds.has(report.id)).length, total: items.length };
  });
}
const receivedWeekly = cohorts('receivedAt', weekStart);
const mergedWeekly = cohorts('mergedAt', weekStart);
const weeks = [...new Set([...receivedWeekly, ...mergedWeekly].map((row) => row.cohort))].sort();
const weekly = weeks.map((week) => {
  const received = receivedWeekly.find((row) => row.cohort === week) ?? { ...tally([]), oneDayFlag: 0, total: 0 };
  const merged = mergedWeekly.find((row) => row.cohort === week) ?? { ...tally([]), oneDayFlag: 0, total: 0 };
  const row = { weekStart: week };
  for (const [prefix, values] of [['received', received], ['merged', merged]]) {
    for (const key of [...causes, 'oneDayFlag', 'total']) row[`${prefix}_${key}`] = values[key];
  }
  return row;
});
const tagDisagreements = reports.filter((report) => report.meta.intakeTag !== coarseCause(report)).map(representative);
const intakeTagCrossTab = ['parser', 'hint'].map((tag) => ({
  intakeTag: tag, ...tally(reports.filter((report) => report.meta.intakeTag === tag)),
  total: reports.filter((report) => report.meta.intakeTag === tag).length
}));
const july2 = reports.filter((report) => report.mergedAt.startsWith('2026-07-02'));
const audit = {
  schemaVersion: 2,
  intendedRepository: 'hsaavr/mega-s01e03-what-it-shows',
  source: { path: 'src/lib/data/reports-4471.json', sha256: createHash('sha256').update(reportText).digest('hex') },
  methodology: {
    identity: 'Deduplicate id only after asserting repeated records are identical.',
    tenantDateOrder: 'Intl.DateTimeFormat(locale,{day:"2-digit",month:"2-digit",year:"numeric"}).formatToParts; compare day and month positions.',
    coarse: 'Known day-first tenant AND channel=form AND tenant.form=booking-v3 => hint; other known day-first => parser; unknown or non-day-first => unplaced.',
    oneDayFlag: 'desk-notes.oneDayMove IDs are an overlapping symptom subset; preserve their underlying desk filing. Group counts are coverage memberships, not disjoint root-cause totals.',
    intakeTag: 'Browser-derived guess; excluded from desk filing classification.',
    cohorts: 'Distinct reports by primary desk filing, Monday-start weeks, timestamp local calendar date. oneDayFlag is an overlapping subset and must not be added to total. receivedAt measures incoming reports; mergedAt measures ticket triage.'
  },
  totals: {
    inputRows: input.length, uniqueReportIds: reports.length, duplicateExtraRows: input.length - reports.length,
    duplicateIds: [...occurrences].filter(([, count]) => count > 1).map(([id, count]) => ({ id, count })),
    coarseUnique: tally(reports, coarseCause), coarseRaw: tally(input, coarseCause),
    finalUnique: tally(reports), finalRaw: tally(input),
    coverageCounts: Object.fromEntries(groups.map((group) => [group.cause, group.count])),
    overlap: {
      parserAndOneDay: reports.filter((report) => cause(report) === 'parser' && oneDayIds.has(report.id)).length,
      hintAndOneDay: reports.filter((report) => cause(report) === 'hint' && oneDayIds.has(report.id)).length,
      distinctReportUnion: new Set(groups.flatMap((group) => group.ids)).size,
      memberships: groups.reduce((sum, group) => sum + group.count, 0)
    },
    intakeTagDisagreementCount: tagDisagreements.length,
    explicitTransposeCount: reports.filter(explicitTranspose).length,
    firstSeen: earliest(reports), lastSeen: latest(reports)
  },
  tenantDateOrder, groups, intakeTagCrossTab, tagDisagreements,
  formCrossTab: [...new Set([...tenants.values()].map((tenant) => tenant.form))].sort().map((form) => {
    const items = reports.filter((report) => tenants.get(report.tenant)?.form === form);
    return { form, ...tally(items), total: items.length };
  }),
  monthlyReceived: cohorts('receivedAt', (iso) => iso.slice(0, 7)),
  monthlyMerged: cohorts('mergedAt', (iso) => iso.slice(0, 7)),
  weekly,
  mergeBacklogEvidence: {
    mergedOn2026July2: { count: july2.length, ...tally(july2), firstReceived: earliest(july2), lastReceived: latest(july2) },
    weekStarting2026June29: weekly.find((row) => row.weekStart === '2026-06-29'),
    interpretation: 'The July 2 merge spike is a triage backlog event; it is not evidence that incoming reports spiked that day.'
  },
  limitations: [
    'Counts describe reports, not unique bookings, users, incidents, or incidence rates.',
    'Tenant form metadata is not versioned per report; classification uses the available current tenant export.',
    'Desk filing counts are not independently confirmed root-cause counts. Four unflagged parser-filed reports have weaker body detail: R-41290, R-41417, R-41514, R-41615.',
    'One-day group membership follows desk notes and overlaps parser filing; R-41236 does not independently demonstrate a one-day move.',
    'One-day root cause is unknown. A timezone or date-only conversion is a hypothesis requiring reproduction.',
    'The first week begins with April 1 data; the October monthly bucket ends October 4.'
  ],
  records: reports.map((report) => ({ ...representative(report), mergedAt: report.mergedAt, coarseCause: coarseCause(report), receivedWeek: weekStart(report.receivedAt), mergedWeek: weekStart(report.mergedAt) }))
};
assert.deepEqual(audit.totals.coverageCounts, { parser: 379, hint: 33, 'one-day': 5, unplaced: 0 });
assert.deepEqual(audit.totals.overlap, { parserAndOneDay: 5, hintAndOneDay: 0, distinctReportUnion: 412, memberships: 417 });
assert.equal(audit.totals.overlap.distinctReportUnion, reports.length);
assert.equal(audit.totals.overlap.memberships - audit.totals.overlap.parserAndOneDay - audit.totals.overlap.hintAndOneDay, reports.length);
assert.equal(audit.totals.explicitTransposeCount, 403);
for (const row of weekly) {
  for (const prefix of ['received', 'merged']) {
    assert.equal(row[`${prefix}_parser`] + row[`${prefix}_hint`] + row[`${prefix}_unplaced`], row[`${prefix}_total`]);
  }
}
assert.equal(weekly.reduce((sum, row) => sum + row.received_total, 0), reports.length);
assert.equal(weekly.reduce((sum, row) => sum + row.merged_total, 0), reports.length);
const evidence = new URL('evidence/', root);
await mkdir(evidence, { recursive: true });
await writeFile(new URL('report-audit.json', evidence), `${JSON.stringify(audit, null, 2)}\n`);
const columns = Object.keys(weekly[0]);
await writeFile(new URL('weekly-cohorts.csv', evidence), `${columns.join(',')}\n${weekly.map((row) => columns.map((key) => row[key]).join(',')).join('\n')}\n`);
console.log(JSON.stringify({ rows: input.length, unique: reports.length, duplicates: input.length - reports.length, coverage: audit.totals.coverageCounts, overlap: audit.totals.overlap, disagreements: tagDisagreements.length, evidence: fileURLToPath(evidence) }, null, 2));
