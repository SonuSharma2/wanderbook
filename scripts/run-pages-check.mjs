import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';
await mkdir('.sites-runtime',{recursive:true});
await build({entryPoints:['scripts/pages-check.jsx'],outfile:'.sites-runtime/pages-check.mjs',bundle:true,platform:'node',format:'esm',packages:'external',jsx:'automatic',define:{'import.meta.env':'{"BASE_URL":"/wanderbook/"}'},logLevel:'warning'});
await import('../.sites-runtime/pages-check.mjs?run='+Date.now());
