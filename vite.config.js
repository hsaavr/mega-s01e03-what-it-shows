import { defineConfig } from 'vite';
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: { alias: { '#lib': fileURLToPath(new URL('./src/lib', import.meta.url)) } },
  plugins: [svelte({
    extensions: ['.svelte', '.svx'],
    preprocess: [vitePreprocess(), mdsvex({
      extensions: ['.svx'],
      layout: { runbook: fileURLToPath(new URL('./src/lib/layouts/runbook.svelte', import.meta.url)) },
      layoutPropForwarding: 'runes',
    })],
    compilerOptions: { css: 'injected' },
  })],
});
