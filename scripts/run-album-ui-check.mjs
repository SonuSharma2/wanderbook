import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';
await mkdir('.sites-runtime',{recursive:true});
await build({entryPoints:['scripts/album-ui-check.jsx'],outfile:'.sites-runtime/album-ui-check.mjs',bundle:true,platform:'node',format:'esm',packages:'external',jsx:'automatic',logLevel:'warning'});
await import('../.sites-runtime/album-ui-check.mjs?run='+Date.now());
