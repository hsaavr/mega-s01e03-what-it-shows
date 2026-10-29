# Booking-v3 date-field hint contradicts tenant interpretation — 33 reports

Publication record for [2](https://github.com/hsaavr/mega-s01e03-what-it-shows/issues/2).

## Problem and coverage

The booking-v3 form prints `MM/DD/YYYY` while it interprets input using its day-first tenant locale. A person following that guidance can book a different date than intended. The exported desk view assigns **33 distinct reports** to this form-guidance problem.

Affected reports have `channel === 'form'`, a known day-first tenant, and tenant form `booking-v3`. Tenant coverage is Alder Physio 12, Copper Studio 11, and Pale Harbour 10. R-41230 describes a client coming on 1 June instead of 6 January; R-41241 describes 8 June instead of 6 August.

## Reproduction to verify

This follows the supplied diagnostic behavior and has not been executed against a production booking UI.

1. Open Copper Studio's booking-v3 form (`es-ES`).
2. Intend 7 April 2026 and follow `MM/DD/YYYY` by entering `04/07/2026`.
3. Inspect the interpreted date, confirmation, and invitation.

Expected: the visible guidance and actual interpretation agree and preserve the intended 7 April. Documented faulty behavior: the form interprets the value as 4 July.

## Acceptance

Align the visible hint, validation, and actual input convention for each affected tenant locale. Verify ambiguous pairs, days above 12, confirmation and invitation values. Vary browser locale while keeping tenant settings fixed. A string-only change passes only when following the displayed guidance yields the intended date end to end.

Evidence and exact report IDs: `evidence/report-audit.json`, the tenant directory, and `DATE_HINT` in `src/lib/kb/causes.ts`. Recompute with `node scripts/analyze.mjs`. This issue requests one fix: make booking-v3's visible date guidance agree with its actual interpretation.

## Desk disposition

The course engineering update reports WON'T FIX: booking-v3 form retired. #4471 is marked closed 05 Oct. This is retirement, not a claim that the field guidance was repaired.

Source: [course engineering update](https://hq.mega.dev/challenges/what-it-shows), observed 29 October 2026.
