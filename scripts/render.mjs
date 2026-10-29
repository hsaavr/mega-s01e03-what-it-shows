import { createServer } from 'vite';
import { mkdir, writeFile, readdir } from 'node:fs/promises';
import { join, relative, dirname } from 'node:path';
import { inputHashes } from './kb-check.mjs';

const root = process.cwd();
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
async function pages(dir) {
  const found = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, item.name);
    if (item.isDirectory()) found.push(...await pages(path));
    else if (item.name === '+page.svx') found.push(path);
  }
  return found;
}
try {
  const { render } = await server.ssrLoadModule('svelte/server');
  for (const path of await pages(join(root, 'src/routes'))) {
    const modulePath = '/' + relative(root, path);
    const page = await server.ssrLoadModule(modulePath);
    const { head, body } = render(page.default);
    const route = relative(join(root, 'src/routes'), dirname(path));
    const output = join(root, 'rendered', route, 'index.html');
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${head}</head><body>${body}</body></html>\n`);
    console.log(relative(root, output));
  }
  await writeFile(join(root, 'rendered/manifest.json'), JSON.stringify({ generatedAt: new Date().toISOString(), inputs: await inputHashes(root) }, null, 2) + '\n');
} finally {
  await server.close();
}
