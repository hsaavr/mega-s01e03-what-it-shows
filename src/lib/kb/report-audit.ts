import raw from '#lib/data/reports-4471.json';
import notes from '#lib/data/desk-notes.json';
import { causeOf, uniqueById, type Report } from '#lib/kb/causes';
import { tenantOf } from '#lib/kb/locales';

export type Problem = 'parser' | 'hint' | 'one-day' | 'unplaced';
export const labels: Record<Problem, string> = {
  parser: 'Parser filing in the exported desk view',
  hint: 'booking-v3 hint disagrees with tenant date parsing',
  'one-day': 'One-day flags (already included in parser filing)',
  unplaced: 'Needs classification',
};
export const reports = uniqueById(raw as Report[]).filter((r) => r.mergedInto === 4471);
export const oneDayIds = new Set(notes.oneDayMove);
export function problemOf(r: Report): Problem {
  return causeOf(r, tenantOf(r)) ?? 'unplaced';
}
export const groups = (['parser', 'hint', 'one-day', 'unplaced'] as Problem[]).map((problem) => {
  const rows = reports.filter((r) => problem === 'one-day' ? oneDayIds.has(r.id) : problemOf(r) === problem);
  const days = rows.map((r) => r.receivedAt.slice(0, 10)).sort();
  return { problem, label: labels[problem], rows, count: rows.length,
    tenants: new Set(rows.map((r) => r.tenant)).size,
    first: days[0], last: days.at(-1) };
}).filter((g) => g.count);
export const audit = {
  rawRows: raw.length,
  unique: reports.length,
  repeatedRows: raw.length - uniqueById(raw as Report[]).length,
  coarseParser: reports.filter((r) => causeOf(r, tenantOf(r)) === 'parser').length,
  coarseHint: reports.filter((r) => causeOf(r, tenantOf(r)) === 'hint').length,
  parserExcludingFlags: reports.filter((r) => causeOf(r, tenantOf(r)) === 'parser' && !oneDayIds.has(r.id)).length,
  misleadingTags: reports.filter((r) => r.meta.intakeTag !== causeOf(r, tenantOf(r))).length,
  mergedOnJuly2: reports.filter((r) => r.mergedAt?.startsWith('2026-07-02')).length,
};
const start = Date.parse('2026-03-30');
const end = Date.parse('2026-10-05');
const week = 7 * 86400000;
export const weeks = Array.from({ length: (end - start) / week }, (_, i) => {
  const at = start + i * week;
  const inside = (iso: string | null) => iso && Date.parse(iso.slice(0, 10)) >= at && Date.parse(iso.slice(0, 10)) < at + week;
  return { at: new Date(at).toISOString().slice(0, 10),
    received: reports.filter((r) => inside(r.receivedAt)).length,
    merged: reports.filter((r) => inside(r.mergedAt)).length };
});
export const backlogWeek = weeks.find((w) => w.at === '2026-06-29')!;
