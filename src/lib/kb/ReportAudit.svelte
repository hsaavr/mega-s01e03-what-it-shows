<script lang="ts">
  import { audit, groups, backlogWeek, weeks, oneDayIds, reports } from '#lib/kb/report-audit';
  import issueLinks from '#lib/data/issue-links.json';
  const links = issueLinks as Record<string, string>;
</script>

<p><strong>{audit.unique} distinct reports</strong> from {audit.rawRows} exported rows; {audit.repeatedRows} repeated rows removed by report ID. Counts measure reports, not customers or bookings.</p>
<table>
  <caption>Issue coverage in the exported desk view; one-day flags overlap parser</caption>
  <thead><tr><th>Problem</th><th>Reports</th><th>Tenants</th><th>Received</th><th>Ticket</th></tr></thead>
  <tbody>
    {#each groups as g (g.problem)}
      <tr><td>{g.label}</td><td><strong>{g.count}</strong></td><td>{g.tenants}</td><td><time>{g.first}</time><br />→ <time>{g.last}</time></td><td>{#if links[g.problem]}<a href={links[g.problem]}>GitHub issue</a>{:else}<span>Local draft</span>{/if}</td></tr>
    {/each}
  </tbody>
</table>

<h3>How the counts were checked</h3>
<p>The exported tenant/channel classifier gives parser {audit.coarseParser} and hint {audit.coarseHint}. The {oneDayIds.size} desk-noted one-day reports stay inside the parser filing and are tracked separately as a symptom flag. Do not add the issue rows to obtain a distinct-report total: they contain overlapping coverage.</p>
<p>Removing the flagged subset gives a derived residual of {audit.parserExcludingFlags} parser-filed reports. That residual is not the desk's parser count. Filing counts describe the exported view; they do not prove the same root cause for every report.</p>
<p>{audit.misleadingTags} intake tags disagree with the tenant/channel classifier. Intake tags reflect a browser-locale guess; they are not the problem identity. Deduplicate by ID, join the tenant directory, check its locale with <code>Intl.DateTimeFormat</code>, and use the channel and actual form version.</p>

<h3>Received dates and merge dates answer different questions</h3>
<p>The week starting {backlogWeek.at} received {backlogWeek.received} reports but recorded {backlogWeek.merged} merges; {audit.mergedOnJuly2} merges occurred on 2026-07-02. The large merge bar is a backlog operation. It does not establish a new failure spike on that day.</p>
<details><summary>Exact weekly counts for the reports currently in #4471</summary>
  <table><thead><tr><th>Week starting Monday</th><th>Received</th><th>Merged</th></tr></thead><tbody>
    {#each weeks as w (w.at)}<tr><td>{w.at}</td><td>{w.received}</td><td>{w.merged}</td></tr>{/each}
  </tbody></table>
</details>

<h3>One-day evidence that needs its own investigation</h3>
<ul>{#each reports.filter((r) => oneDayIds.has(r.id)) as r (r.id)}<li><code>{r.id}</code> · {r.tenant}: {r.body}</li>{/each}</ul>
<p>The Lisbon/Toronto example makes timezone conversion worth investigating. The export does not prove a timezone, UTC, or daylight-saving root cause. R-41236 relies on the desk note for its membership; its body alone does not establish a one-day shift.</p>

<style>
  caption { text-align: left; font-weight: 600; margin-bottom: 0.4rem; }
  th, td { vertical-align: top; }
  details { padding: 0.75rem 0; }
  summary { cursor: pointer; color: var(--accent); }
  time { white-space: nowrap; }
  @media (max-width: 600px) { table { display: block; overflow-x: auto; } }
</style>
