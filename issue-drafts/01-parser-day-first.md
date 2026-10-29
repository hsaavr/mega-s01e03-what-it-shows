# Shared parser transposes day-first tenant dates — 374 reports

Publication record for [1](https://github.com/hsaavr/mega-s01e03-what-it-shows/issues/1).

For a tenant that writes dates day first, an intended appointment date such as 7 April becomes 4 July. The supplied diagnostic comments in `src/lib/kb/causes.ts` (lines 36–42) describe the shared parser reading every date month first. Its interpretation must agree with the tenant's date convention.

## Evidence and scope

- **374 distinct reports**, after removing the separate five day-shift reports and assigning the booking-v3 form cases to the separate hint issue. First received April 1, 2026; last received October 4, 2026.
- **370** bodies explicitly show a day/month transposition. Four reports have weaker body detail and remain in this group through the documented classifier: `R-41290`, `R-41417`, `R-41514`, `R-41615`.
- All 11 tenant locales in `src/lib/data/tenants/` have day before month under the exact `Intl.DateTimeFormat(...).formatToParts` check. Coarse parser membership is a known day-first tenant outside the booking-v3/form conjunction. Then the five `desk-notes.oneDayMove` IDs are removed.
- `R-41200`, Harbour Dental, `en-GB`, booking-v2, app: “Our 7 April reminder went out on 4 July.” `R-41201` is a separately identified correction with the reverse dates. Both remain distinct report IDs; the export has no booking identity to establish incident deduplication.
- `R-41205`, Morrow Tax, booking-v2/app: booked 3 October, invite 10 March. Its `en-US` browser causes the intake guess to say `hint`, but the tenant/form/channel classifier places it here.
- `R-41370`, Pale Harbour, booking-v3/**email**: 9 December became 12 September. Booking-v3 alone does not establish the form hint path.

The audit reads `src/lib/data/reports-4471.json`, tenant metadata, and desk notes. Inspect `evidence/report-audit.json` for all IDs and source lines. Reproduce the audit with `node scripts/analyze.mjs`.

## Reproduction recipe

This recipe is derived from documented diagnostic behavior; it has not been executed against a booking UI.

1. Select Harbour Dental (`en-GB`, booking-v2) and the shared parser path represented by an app booking.
2. Supply `07/04/2026`, explicitly intending **7 April 2026** under the tenant's day-first convention.
3. Observe the parsed appointment and its calendar invite.

Expected: the appointment and invite represent 7 April 2026. Documented current behavior: month-first parsing interprets the same input as 4 July 2026. Browser locale must not substitute for the tenant convention.

## Acceptance tests

- Ambiguous day-first dates such as `07/04/2026` and `03/10/2026` preserve 7 April and 3 October through parsing, storage, reminders, and invitation generation.
- Valid dates with a day above 12, including `13/04/2026`, remain valid and exact. Invalid dates are rejected explicitly rather than silently normalized.
- Cover every tenant locale in the export; vary browser locale independently, including `en-US` and `en-GB`.
- Verify all actual booking entry paths that call the shared parser, and both form versions where that parser applies. The report's `channel` field is the classifier input; confirm its relationship to runtime entry paths during implementation.
- Keep a regression fixture for the five desk-noted day-shift IDs separate; this fix does not establish their root cause or resolution.

## Counting limits

The export contains 427 rows, **412 distinct report IDs**, and 15 identical replay rows. Counts represent reports, not bookings or affected-user rates. Tenant form metadata is not historically versioned. Final classification follows the supplied diagnostic logic, rather than the browser-derived `intakeTag` guess. The broader incoming-report trend must use `receivedAt`; the July 2 merge backlog is not an onset spike.
