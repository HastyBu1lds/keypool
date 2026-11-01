// Bundles src-swiss/app.js into public-swiss/app.js (one file, no CDN) and copies the self-hosted font.
import { build } from 'esbuild';
import { copyFileSync, mkdirSync } from 'node:fs';

mkdirSync('public-swiss/fonts', { recursive: true });
copyFileSync('node_modules/@fontsource-variable/public-sans/files/public-sans-latin-wght-normal.woff2', 'public-swiss/fonts/public-sans.woff2');

await build({
  entryPoints: ['src-swiss/app.js'],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2020',
  outfile: 'public-swiss/app.js',
  legalComments: 'none',
});
console.log('built public-swiss/app.js');
