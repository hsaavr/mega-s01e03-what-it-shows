# Support KB entry point

Purpose: help the desk and its agents distinguish product problems, retain evidence and uncertainty, and find the current procedure without losing decision history.

## Find the relevant context

| Need | Open |
|---|---|
| Understand #4471 | `src/routes/kb/incidents/4471-review/+page.svx`, then its rendered HTML |
| Count or regroup reports | `evidence/report-audit.json`, then `scripts/analyze.mjs`, `src/lib/kb/causes.ts`, tenant data and desk notes |
| Triage new reports | `src/routes/kb/triage/dedupe/+page.svx` |
| Understand the old rule and its replacement | accepted decision 0001, then proposed decision 0002 under `src/routes/kb/decisions/` |
| Refresh or add knowledge | `.agents/skills/support-kb-maintain/SKILL.md` |
| Find current work and unresolved questions | `knowledge/work.json` |
| Check evidence versions and provenance | `knowledge/sources.json` |

Start with these pointers and `rg`; this small base does not need a search service. Read source logic when a prose page or intake tag disagrees with the evidence. Reading `.svx` alone misses computed content: render and inspect the components too.

## Authority and time

Raw exports under `src/lib/data/` remain immutable source material during an analysis. `evidence/` and `rendered/` are derived outputs. Issues belong in the tracker once published; this KB distills findings and links to them. Draft files are publication inputs, not evidence of live issues.

Keep these concepts separate:

- `evidence_as_of`: the latest date covered by the source snapshot.
- `reviewed`: when an agent actually checked the note against that evidence.
- `status` and `confidence`: what the evidence supports; a proposal is not an accepted decision or a shipped fix.
- `knowledge/work.json` publication state: whether tracker links exist and when they were actually checked.

The manifest records source content hashes. A changed source invalidates the prior review until an agent evaluates the change. A desk ref identifies the signature text; it is not a content checksum or a certification of accuracy. Never refresh review dates or baseline hashes just to silence a check.

For S01E03 the signature must be the exact course-issued `ticket`, obtained from `start-challenge`, not an author label. That tool also declares the claim answer as an object with `repo` set to the public owner/name or GitHub URL. Keep the logs outside this public repo; publish the signature only in its required frontmatter location.

## One intake path

Record new exports, report corrections, or tracker status updates as a small JSON pointer in `inbox/`; see `inbox/README.md`. Review each item, connect it to existing notes or a new note, and mark it processed only after the derived artifacts and checks agree. Keep evidence in its authoritative location rather than copying tracker discussions into the KB.

Run `npm run kb:check` for source changes, missing metadata, unsigned pages, stale renders, old reviews, and pending inbox items. After reviewing any changed evidence and deliberately recording its new source manifest, run `npm run kb:refresh` to rebuild and verify the KB. New data may require revising #4471's regression expectations; a failed old assertion is a review prompt, not a reason to alter the data.

This is an on-demand local workflow. No background job, webhook, external synchronization, or recurring schedule is configured.
