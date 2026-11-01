// Bundles src/app.js into public/app.js (one file, no CDN) and copies the self-hosted fonts.
import { build } from 'esbuild';
import { copyFileSync, mkdirSync } from 'node:fs';

mkdirSync('public/fonts', { recursive: true });
copyFileSync('node_modules/@fontsource/vt323/files/vt323-latin-400-normal.woff2', 'public/fonts/vt323.woff2');
copyFileSync('node_modules/@fontsource/cutive-mono/files/cutive-mono-latin-400-normal.woff2', 'public/fonts/cutive-mono.woff2');

await build({
  entryPoints: ['src/app.js'],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2020',
  outfile: 'public/app.js',
  legalComments: 'none',
});
console.log('built public/app.js');
