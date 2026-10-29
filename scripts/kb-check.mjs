import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, relative, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const validDay = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value ?? '') && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const today = (zone) => new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export async function files(root, dir) {
  const found = [];
  for (const item of await readdir(join(root, dir), { withFileTypes: true })) {
    const path = join(dir, item.name);
    if (item.isDirectory()) found.push(...await files(root, path));
    else found.push(path);
  }
  return found.sort();
}
export async function inputHashes(root) {
  const paths = [...await files(root, 'src'), 'package.json', 'package-lock.json', 'vite.config.js', 'scripts/render.mjs', 'scripts/kb-check.mjs', 'knowledge/sources.json'];
  return Object.fromEntries(await Promise.all(paths.map(async (path) => [path, digest(await readFile(join(root, path)))])));
}
// These KB conventions use scalar frontmatter fields. mdsvex separately validates/compiles the real YAML during rendering.
function metadata(source) {
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatter) throw new Error('Missing frontmatter');
  return Object.fromEntries(frontmatter[1].split(/\r?\n/).flatMap((line) => {
    const match = line.match(/^([\w-]+):\s*(.*)$/);
    return match ? [[match[1], match[2].replace(/^(['"])(.*)\1$/, '$2').trim()]] : [];
  }));
}
export async function checkKnowledge(root, { asOf, sourcesOnly = false } = {}) {
  root = resolve(root);
  const errors = [], warnings = [];
  const add = (list, code, path, message) => list.push({ code, path, message });
  const json = async (path) => JSON.parse(await readFile(join(root, path), 'utf8'));
  const manifest = await json('knowledge/sources.json');
  const day = asOf ?? today(manifest.time_zone);
  if (!validDay(day)) throw new Error('asOf must be a valid YYYY-MM-DD date');
  const local = (path) => {
    if (relative(root, resolve(root, path)).startsWith('..') || path.startsWith('/')) throw new Error(`Expected repository-relative path: ${path}`);
    return join(root, path);
  };
  for (const [key, set] of Object.entries(manifest.source_sets)) {
    if (!validDay(set.evidence_as_of) || !validDay(set.reviewed_on)) add(errors, 'source-date', key, 'Invalid evidence or review date');
    for (const [path, hash] of Object.entries(set.sha256)) {
      try {
        if (digest(await readFile(local(path))) !== hash) add(errors, 'source-changed', path, `Re-review source set ${key}; do not just reset its hash`);
      } catch (error) { add(errors, 'source-missing', path, error.message); }
    }
  }
  if (sourcesOnly) return { asOf: day, errors, warnings };
  for (const path of (await files(root, 'src/routes/kb')).filter((path) => path.endsWith('/+page.svx'))) {
    try {
      const source = await readFile(local(path), 'utf8');
      const meta = metadata(source);
      const legacy = manifest.legacy_pages.includes(path);
      for (const field of ['title', 'owner', 'status', 'reviewed', ...legacy ? [] : ['kind', 'confidence', 'signature', 'source_set', 'evidence_as_of']]) {
        if (!meta[field]?.trim()) add(errors, 'missing-metadata', path, `Missing ${field}`);
      }
      if (!validDay(meta.reviewed)) add(errors, 'review-date', path, 'Invalid review date');
      if (!legacy) {
        if (!/<RenderStamp\s+\{signature\}\s*\/>/.test(source)) add(errors, 'unsigned-render', path, 'Must render the frontmatter signature through RenderStamp');
        const set = manifest.source_sets[meta.source_set];
        if (!set) add(errors, 'unknown-source-set', path, 'Source set must exist in knowledge/sources.json');
        else {
          if (meta.evidence_as_of !== set.evidence_as_of) add(errors, 'evidence-cutoff', path, 'Page cutoff differs from its source set');
          if (meta.reviewed < set.reviewed_on) add(errors, 'source-review-newer', path, 'Page must be reviewed against the latest source review');
        }
        if (!validDay(meta.evidence_as_of) || meta.reviewed < meta.evidence_as_of) add(errors, 'evidence-date', path, 'Review must follow a valid evidence cutoff');
      }
      const historical = manifest.historical_pages.includes(path);
      if (!historical && validDay(meta.reviewed) && (Date.parse(day) - Date.parse(meta.reviewed)) / 86400000 > manifest.review_after_days) add(warnings, 'review-due', path, 'Review date has exceeded the maintenance threshold');
      if (meta.reviewed > day) add(warnings, 'future-review', path, 'Review date is in the future');
    } catch (error) { add(errors, 'page-invalid', path, error.message); }
  }
  const work = await json('knowledge/work.json');
  const links = await json('src/lib/data/issue-links.json');
  if (work.publication.status === 'not-published') add(warnings, 'publication-pending', 'knowledge/work.json', 'Issue links and course acceptance remain pending');
  else if (work.publication.status === 'published') {
    if (!validDay(work.publication.verified_on)) add(errors, 'tracker-unverified', 'knowledge/work.json', 'Published state needs a real tracker verification date');
    for (const problem of ['parser', 'hint', 'one-day']) if (!/^https:\/\/github\.com\/hsaavr\/mega-s01e03-what-it-shows\/issues\/\d+$/.test(links[problem] ?? '')) add(errors, 'missing-issue-link', problem, 'Published problem needs a verified issue URL');
  } else add(errors, 'publication-state', 'knowledge/work.json', 'Unknown publication state');
  for (const path of (await files(root, 'inbox')).filter((path) => path.endsWith('.json'))) {
    try {
      const item = await json(path);
      for (const field of ['id', 'source', 'summary']) if (typeof item[field] !== 'string' || !item[field].trim()) add(errors, 'inbox-field', path, `Missing ${field}`);
      if (!['export', 'correction', 'tracker-update'].includes(item.type) || !validDay(item.received_on)) add(errors, 'inbox-field', path, 'Invalid type or received date');
      if (!manifest.source_sets[item.source_set]) add(errors, 'inbox-source-set', path, 'Unknown source set');
      if (item.status === 'pending') add(warnings, 'inbox-pending', path, 'Review and file this evidence before marking it processed');
      else if (item.status === 'processed') {
        if (!Array.isArray(item.filed_in) || !item.filed_in.length) add(errors, 'inbox-unfiled', path, 'Processed item needs destination pages');
        else for (const target of item.filed_in) await readFile(local(target));
      } else add(errors, 'inbox-status', path, 'Unknown intake status');
      if (!/^https?:\/\//.test(item.source)) await readFile(local(item.source));
    } catch (error) { add(errors, 'inbox-invalid', path, error.message); }
  }
  try {
    const rendered = await json('rendered/manifest.json');
    const current = await inputHashes(root);
    for (const path of new Set([...Object.keys(current), ...Object.keys(rendered.inputs)])) {
      if (current[path] !== rendered.inputs[path]) add(errors, 'render-stale', path, 'Rebuild rendered pages after source changes');
    }
  } catch (error) { add(errors, 'render-manifest', 'rendered/manifest.json', error.message); }
  return { asOf: day, errors, warnings };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const report = await checkKnowledge(root, { sourcesOnly: process.argv.includes('--sources-only') });
  for (const [label, list] of [['ERROR', report.errors], ['NOTE', report.warnings]]) for (const finding of list) console.log(`${label} ${finding.code}: ${finding.path} — ${finding.message}`);
  console.log(`Knowledge health as of ${report.asOf}: ${report.errors.length} errors, ${report.warnings.length} notes.`);
  if (report.errors.length) process.exitCode = 1;
}
