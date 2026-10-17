import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
 root:fileURLToPath(new URL('.',import.meta.url)),
 base:process.env.PAGES_BASE_PATH||'/wanderbook/',
 publicDir:fileURLToPath(new URL('../public',import.meta.url)),
 plugins:[react()],
 build:{outDir:fileURLToPath(new URL('../pages-dist',import.meta.url)),emptyOutDir:true,target:'es2022'},
 server:{host:'127.0.0.1',port:5174},
});
