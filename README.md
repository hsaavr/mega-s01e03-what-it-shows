# S01E03 · #4471 review

MEGA.dev course work by `hsaavr` with a Codex harness. The support desk and reports are course story material.

For agent navigation and upkeep, start at [KNOWLEDGE.md](KNOWLEDGE.md) and the [maintenance skill](.agents/skills/support-kb-maintain/SKILL.md). New evidence enters through [inbox/](inbox/README.md); run `npm run kb:check` to detect changed sources, incomplete metadata, and stale generated pages. `npm run kb:refresh` rebuilds and verifies after evidence has been reviewed.

- Signed review source: [4471-review/+page.svx](src/routes/kb/incidents/4471-review/+page.svx).
- Desk page, rendered from that source with the supplied Svelte layout and data: [rendered review](rendered/kb/incidents/4471-review/index.html).
- Reproducible evidence: [report audit and ID membership](evidence/report-audit.json), [weekly cohorts](evidence/weekly-cohorts.csv).
- [Issue publication records](issue-drafts/) cover two supported paths: parser **379** and hint **33**, totaling **412** distinct reports. Five one-day symptom notes remain within parser filing; they do not establish another defect.
- The original accepted decision 0001 is preserved unchanged; decision 0002 proposes evidence-based triage.

The review covers the export through 4 October 2026. Its review date does not imply new queue data. One-day root cause remains unconfirmed. This repository documents problems; it does not contain a production booking-system fix.

Live issues: [parser #1](https://github.com/hsaavr/mega-s01e03-what-it-shows/issues/1), [form hint #2](https://github.com/hsaavr/mega-s01e03-what-it-shows/issues/2), with [closed speculative issue #3](https://github.com/hsaavr/mega-s01e03-what-it-shows/issues/3) retained as history. Both supported tickets are now closed: the desk reports the date reader fixed, and the hint closed without a fix because booking-v3 was retired. The course accepted the completed tickets and signed page. [Read the saved debrief](https://hq.mega.dev/challenges/what-it-shows#debrief).

## Reproduce

Use Node.js 24 or later. Dependencies are locked in `package-lock.json`.

```sh
npm ci --ignore-scripts
npm run analyze
npm run render
npm run verify
python3 -m http.server 8763 --bind 127.0.0.1 --directory rendered
```

Open `http://127.0.0.1:8763/kb/incidents/4471-review/` to inspect the page and its desk reference. The renderer compiles the actual `.svx` and imported Svelte components with mdsvex, the `#lib` alias, Vite glob loading, and server rendering. Styles are injected into each standalone HTML page. Native disclosure controls work without JavaScript; this export does not hydrate Svelte client interactions.

The independent analysis command reads only the dataset and tenant metadata. Its overlapping diagnostic flag group is an annotation, not another open issue. Verification compares its report membership with the page's classifier, checks rendered counts and the signature, validates internal links, and checks that accepted decision 0001 still matches the original export.

---

# kb — the support knowledge base

**kb** = knowledge base. What the support desk knows about how our products break, written
down where the code can keep it honest.

One desk takes reports for every product we run: `sched-prod` (calendar invites for about
300k people) and the rest. When something
goes wrong, the reports reach the desk first. This kb is how the desk triages them, what each
incident turned out to be, and why we decided what we decided.

## What's here

```
src/routes/kb/      the pages (.svx: Markdown with components)
  triage/           how the desk handles incoming reports
  incidents/        one page per big ticket
  decisions/        numbered decision records
src/lib/kb/         components and the logic they run
src/lib/layouts/    the frame every page shares
src/lib/data/       exports from the ticket system
```

## Conventions

- Words in the page, logic in `src/lib` (imported as `#lib/…`). A number that can be computed belongs in a component.
- Every page starts with frontmatter: `title`, `owner`, `status`, `reviewed`.
- A decision is never edited after it is accepted. A new record replaces it.
- A page you add is signed: its frontmatter carries your `signature` and it ends with `<RenderStamp {signature} />`, so the desk knows who wrote it.

## Owners

Support desk. Decision records: whoever signed them.

---

Exported 2026-10-04 from the `support` repo, `apps/kb/` → `src/`.
