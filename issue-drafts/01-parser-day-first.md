# Shared date parser reads day-first input month first — 379 reports

Publication record for [1](https://github.com/hsaavr/mega-s01e03-what-it-shows/issues/1).

## Problem and coverage

The shared date-reading path interprets a day-first tenant's date month first. The exported desk view assigns **379 distinct reports** to this problem. This is the view's filing count, after report-ID deduplication. See the KB review for the full reconciliation and confidence limits.

The behavior is documented by `causeOf` and its comments in `src/lib/kb/causes.ts`. For example, R-41203 reports that a booking for 2 December produced an invite for 12 February. R-41200 describes 7 April appearing as 4 July.

## Reproduction to verify

This follows the supplied diagnostic logic and has not been executed against a production booking UI.

1. Use Harbour Dental's `en-GB` tenant and the shared date-reading path.
2. Enter `07/04/2026`, intending 7 April 2026.
3. Inspect the interpreted appointment and generated invitation.

Expected: 7 April. Documented faulty behavior: 4 July.

## Acceptance

Make interpretation follow the tenant's date convention consistently through storage, reminders, and invitations. Cover ambiguous values such as `07/04/2026`, valid days above 12 such as `13/04/2026`, invalid dates, and browser-locale changes with tenant settings held fixed.

Evidence and exact report IDs: `evidence/report-audit.json`. Recompute with `node scripts/analyze.mjs`. The count measures reports, not bookings or affected-user rates. This issue requests one fix: correct this shared date-reading behavior.

## Desk disposition

The course engineering update reports this problem FIXED: fix(dates): parse dd/mm for eu locales. #4471 is marked closed 05 Oct. This records the desk announcement, not an independently tested production patch.

Source: [course engineering update](https://hq.mega.dev/challenges/what-it-shows), observed 29 October 2026.
