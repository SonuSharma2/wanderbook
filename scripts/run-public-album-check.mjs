import {build} from 'esbuild';
await build({entryPoints:['scripts/public-album-check.jsx'],outfile:'.sites-runtime/public-album-check.mjs',bundle:true,platform:'node',format:'esm',packages:'external',jsx:'automatic',logLevel:'warning'});
await import('../.sites-runtime/public-album-check.mjs?run='+Date.now());
