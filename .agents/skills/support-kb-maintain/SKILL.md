---
name: support-kb-maintain
description: Maintain this support KB when reports, tenant metadata, diagnostic logic, or issue status change; preserve provenance, render computed pages, and check knowledge freshness.
---

Use the repository containing this skill. Read `KNOWLEDGE.md` for the source map and `knowledge/work.json` for current work before changing a note. Open only the source files needed for the task; use fresh source-specific agents when the project's instructions require them.

Treat `.svx` as executable knowledge: imported components and their inputs can contradict the text. Inspect the rendered page, not just the Markdown. Keep computations in `src/lib`; keep the raw export unchanged and derived evidence reproducible.

For incoming evidence, add a pointer under `inbox/` using its documented shape. Follow existing links before creating a note. In #4471, identity is report ID, intake tags are guesses, and tenant/form/channel determine the exported classifier's two cause paths. Count with that view: desk-noted one-day cases remain inside their filed group and are separately flagged, not subtracted or promoted to a third verified cause. Put one supported defect in each issue; keep comparisons, filing reconciliation, and uncertain symptom notes in the KB. Received time dates reports; merged time dates desk activity.

Choose a note structure suited to the finding. `assets/incident.svx` is a starting point for a new incident, not a mandatory outline for every page. Record `kind`, `source_set`, `evidence_as_of`, `confidence`, owner, status, review date and signature. End a new signed page with `<RenderStamp {signature} />`. Link related notes and the issue tracker. Preserve accepted decision records; propose a new record rather than rewriting history.

For S01E03, call `start-challenge` with its known UUID to obtain the submission instructions and signature proof, even when the browser start page leaves these details out. Use the exact returned `ticket` as frontmatter `signature`; author text is insufficient. Its derived desk ref stays valid after expiry. Keep request/reply logs outside the public repo. The declared claim answer is `{ repo: 'owner/name or github.com link' }`; use the returned instructions for receipts, next steps, and debrief.

Run `npm run kb:check` before relying on existing findings. If source hashes changed, compare the old and new evidence, revise affected claims and classifications, and evaluate which other pages depend on that source set. Only after that review, deliberately update the source manifest hashes and review metadata. Do not reset all dates or automatically acknowledge changes. Keep evidence cutoff, note review date, and tracker verification separate. Do not claim that a local draft is published or a documented product bug is fixed.

After edits, run `npm run kb:refresh`. Resolve failures, inspect the rendered counts, uncertainty, navigation and actual desk ref, and mark an inbox item processed only when its filing is complete. For changes to retrieval or this workflow, try a realistic request in a fresh session or source-isolated agent; use the result to correct demonstrated gaps.

Publication remains a separate authorized action. For this challenge every `gh` command uses `GH_CONFIG_DIR=/Users/hectorsaavedra/.config/gh-mega-hsaavr`; verify `hsaavr` before publishing. Read the current conversation's authorization; this skill does not grant it. Do not create a schedule or integration merely because an intake item suggests one.

Git pushes must use that same account. This machine rewrites plain GitHub HTTPS URLs to SSH; the challenge remote uses `https://hsaavr@github.com/hsaavr/mega-s01e03-what-it-shows.git` and a repository-local credential helper invoking `GH_CONFIG_DIR=/Users/hectorsaavedra/.config/gh-mega-hsaavr gh auth git-credential`. Check the effective remote before pushing; do not change global Git settings or embed a token in a URL.
