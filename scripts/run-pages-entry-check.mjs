import {build} from 'esbuild';
await build({entryPoints:['scripts/pages-entry-check.jsx'],outfile:'.sites-runtime/pages-entry-check.mjs',bundle:true,platform:'node',format:'esm',packages:'external',jsx:'automatic',loader:{'.css':'empty'},define:{'import.meta.env':'{"BASE_URL":"/wanderbook/"}'},logLevel:'warning'});
await import('../.sites-runtime/pages-entry-check.mjs?run='+Date.now());
