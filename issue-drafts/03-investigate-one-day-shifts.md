# Investigate five separately noted date/day shifts; root cause unknown

Publication record for [3](https://github.com/hsaavr/mega-s01e03-what-it-shows/issues/3).

Five reports identified by `src/lib/data/desk-notes.json` concern a different date/day-shift symptom and must be separated from month/day transposition. **Root cause is unknown.** A timezone boundary or date-only conversion is a hypothesis to investigate, not a confirmed diagnosis.

## Evidence and confidence

The five IDs are authoritative desk-note membership, not five independently reproduced failures. All originally carry `intakeTag: 'parser'` and all fall in the coarse parser group before this override.

| Report | Tenant | Reported symptom | Evidence limit |
|---|---|---|---|
| `R-41202` | Kettle Books | Invite Tuesday 12 May; calendar Monday 11 May | Explicit adjacent dates; which surface preserves the intended booking needs confirmation. |
| `R-41209` | Alder Physio | Every booking in June is one day off | No actual dates, direction, year, or reproduction details in the body. |
| `R-41236` | Nine Lanterns | Invite arrived before booking was made | No explicit day difference; membership relies on desk notes. |
| `R-41344` | Pale Harbour | Lisbon client got Tuesday; Toronto client got Monday for same meeting | Cross-zone dates can differ legitimately; capture the intended meeting semantics and actual timestamps before diagnosing a fault. |
| `R-41620` | Lantern Row | Tuesday 6 October showed as Monday | Explicit day-of-week shift; the body does not identify the calendar date attached to Monday. |

There are **5 distinct reports**, with no duplicate export rows, first received April 2 and last received October 4, 2026. Tenant forms: booking-v2 **3**, booking-v3 **2**. This group spans both versions and has no form-channel cases; it should not be absorbed into the booking-v3 hint count.

All source lines and original bodies are in `evidence/report-audit.json`. Reproduce the count with `node scripts/analyze.mjs`. The other disjoint groups are parser **374** and hint **33**, for **412 unique reports** from 427 export rows.

## Investigation / reproduction plan

These are proposed investigation steps, not a claimed reproduced timezone bug.

1. Recover the original booking inputs, declared meeting timezone, intended date and time, stored canonical value, reminder timestamp, and complete invite payload for each report. Establish whether each field is a date-only appointment or a timed instant.
2. Compare the form, stored record, reminder, and calendar import using the same meeting timezone. For `R-41202`, establish why the surfaces show May 12 versus May 11; for `R-41620`, establish why Tuesday becomes Monday.
3. Reproduce the Lisbon/Toronto display case with the original instant and zones. Check whether the different weekdays are valid zone rendering or an unintended conversion.
4. If a conversion hypothesis remains plausible, test date-only values and timed appointments around local midnight, month/year boundaries, and timezone offset changes. Capture each transformation rather than inferring it from the final weekday.
5. Investigate reminder creation/send ordering independently for `R-41236`; an early invite alone does not prove a day-shift mechanism.

Expected: date-only appointments preserve their intended calendar date; timed appointments preserve their intended instant and render correctly in the explicitly selected meeting/viewer timezone. Actual reported behavior: adjacent-day or weekday discrepancies and one ordering anomaly, with insufficient evidence yet to identify their shared mechanism.

## Acceptance tests / exit criteria

- Document a reproducible cause for each confirmed defect, including timezone, input semantics, stored value, and the transformation introducing the error.
- Add regression cases for the recovered failures. Check adjacent-day boundaries, relevant offset transitions, and both form versions only after identifying the affected paths.
- Date-only values remain the intended date through storage and invitation generation. Timed values retain their instant and display the correct local date/time for the selected zone; do not require identical calendar dates across different zones when the instant legitimately spans midnight.
- Reminder/invite timestamps obey the confirmed booking and scheduling rules. Explain `R-41236` separately if its mechanism differs.
- Record explicitly which of the five reports reproduce and which remain unconfirmed. Do not mark all five resolved solely because a parser or hint fix passes.

## Trend caution

Three reports arrived in April, one in June, and one in October. The week beginning June 29 received **15** reports across all causes but merged **189**, including four of these earlier day-shift reports. **184** distinct reports were merged on July 2 alone. Merge activity reflects triage backlog, not the onset or resolution of this problem.
