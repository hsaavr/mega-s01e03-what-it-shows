# Booking-v3 shows a month-first hint while reading dates day first — 33 reports

Draft for `hsaavr/mega-s01e03-what-it-shows`. No issue has been published.

The booking-v3 form tells day-first tenants to enter `MM/DD/YYYY`, while the form reads the tenant's day-first convention. A person following the hint can supply a valid date that represents a different appointment. The supplied diagnostic comments in `src/lib/kb/causes.ts` (lines 36–42) identify this separately from the shared parser; the `DATE_HINT` values are booking-v2 `DD/MM/YYYY` and booking-v3 `MM/DD/YYYY`.

## Evidence and scope

- **33 distinct reports**, all with a known day-first tenant, `channel === 'form'`, and tenant `form === 'booking-v3'`. First received April 17, 2026; last received September 22, 2026.
- All **33 bodies explicitly contain transposed day/month dates**. Tenant counts: Alder Physio **12**, Copper Studio **11**, Pale Harbour **10**.
- `R-41230`, Copper Studio, booking-v3/form, browser `en-GB`: client came on 1 June instead of 6 January. Its intake guess says `parser`, but the documented form path places it here.
- `R-41251`, Pale Harbour, booking-v3/form, browser `pt-PT`: 7 January showed as 1 July. Its duplicated export row is counted once.
- `R-41241`, Alder Physio, booking-v3/form, browser `en-US`: clients came on 8 June instead of 6 August. Its intake guess happens to match this classification.
- **15** final hint reports carry the wrong `parser` intake tag; **18** carry `hint`. Conversely, **23** other reports carry `hint` but belong to the parser group. An `en-US` browser is not sufficient to select this cause.

Inspect `evidence/report-audit.json` for report IDs, original tags, source lines, and the exact grouping. Reproduce with `node scripts/analyze.mjs`. No source code fix is included in this issue draft.

## Reproduction recipe

This recipe follows the supplied diagnostic behavior; it has not been executed against a booking UI.

1. Open a booking-v3 form for a day-first tenant, such as Copper Studio (`es-ES`).
2. Intend **7 April 2026** and follow the displayed `MM/DD/YYYY` hint, entering `04/07/2026`.
3. Submit the form and inspect the date it understands, its confirmation, and downstream invite.

Expected: displayed guidance and actual interpretation agree, and the intended date is preserved. Documented current behavior: the hint requests month first while tenant parsing reads day first, so this example is interpreted as **4 July 2026**. Align the guidance with actual tenant parsing and keep that agreement through downstream processing.

## Acceptance tests

- For every booking-v3 tenant locale, the rendered hint, validation message, parsed value, confirmation, and calendar invite agree on the date convention.
- Test ambiguous boundary pairs, including 7 April/4 July and 6 January/1 June, plus valid dates with day above 12 such as 13 April.
- Repeat with browser locales `en-US`, `en-GB`, and the tenant locale while holding tenant settings fixed. The browser-derived intake tag must not affect rendering or parsing.
- Verify that any hint localization produces the actual tenant convention. A display-only string change passes only when the submitted date is correct end to end.
- Verify booking-v2 guidance and all shared parser paths for regression; their cause classification is tracked separately in the parser issue.

## Counting and trend limits

The 33 cases are disjoint from parser **374** and day-shift **5** after ID deduplication. Received monthly hint counts are April **3**, May **6**, June **2**, July **14**, August **4**, September **4**, and October **0** through October 4. These are report counts with no booking-volume denominator or deployment history, so the decline after July does not prove a fix. Use the audit's `receivedAt` cohorts rather than merge dates.
