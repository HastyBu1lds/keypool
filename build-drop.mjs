// Bundles src-drop/app.js into public-drop/app.js (one file, no CDN) and copies the self-hosted fonts.
import { build } from 'esbuild';
import { copyFileSync, mkdirSync } from 'node:fs';

mkdirSync('public-drop/fonts', { recursive: true });
copyFileSync('node_modules/@fontsource-variable/gabarito/files/gabarito-latin-wght-normal.woff2', 'public-drop/fonts/gabarito.woff2');
for (const w of [400, 500, 600]) {
  copyFileSync(`node_modules/@fontsource/be-vietnam-pro/files/be-vietnam-pro-latin-${w}-normal.woff2`, `public-drop/fonts/bvp-${w}.woff2`);
}

await build({
  entryPoints: ['src-drop/app.js'],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2020',
  outfile: 'public-drop/app.js',
  legalComments: 'none',
});
console.log('built public-drop/app.js');
