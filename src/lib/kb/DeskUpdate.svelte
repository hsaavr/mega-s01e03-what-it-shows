<script>
  import update from '#lib/data/desk-update-4471.json';
</script>

<section>
  <h2>Engineering outcome</h2>
  <p>The desk reports #{update.ticket} closed <strong>{update.closed_label}</strong>. This update was observed on {update.observed_on}; report counts below still cover the export through 4 October.</p>
  <table>
    <thead><tr><th>Problem</th><th>Disposition</th><th>Desk's stated reason</th></tr></thead>
    <tbody><tr><td>Shared date parser</td><td><strong>{update.parser.status}</strong></td><td>{update.parser.detail}</td></tr><tr><td>booking-v3 field hint</td><td><strong>{update.hint.status}</strong></td><td>{update.hint.detail}</td></tr></tbody>
  </table>
  <p><a href={update.source_url}>Source: course engineering update</a>. {update.verification} Closure does not mean both problems were fixed.</p>
</section>
