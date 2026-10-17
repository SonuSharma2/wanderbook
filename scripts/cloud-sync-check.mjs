import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { cloudJournal } from '../app/cloud-journal.ts';

// Real local D1/R2 and two separately signed-in HTTP clients; no hosted user data.
const origin='http://127.0.0.1:5173',nativeFetch=globalThis.fetch;
async function signIn(){
 const response=await nativeFetch(origin+'/signin-with-chatgpt?return_to=/',{redirect:'manual'});
 return response.headers.getSetCookie().map(value=>value.split(';')[0]).join('; ');
}
const cookies=await Promise.all([signIn(),signIn()]);assert.ok(cookies.every(Boolean));
let client=0;
globalThis.fetch=(path,options={})=>nativeFetch(new URL(path,origin),{...options,headers:{...options.headers,cookie:cookies[client]}});
const place='Sync QA '+crypto.randomUUID(),id=crypto.randomUUID(),photoId=crypto.randomUUID();
const bytes=await readFile('public/photos/trek.jpg');
const entry={id,title:'Cross-device test',location:place,country:'Nepal',date:'2026-10-17',category:'Trekking',mood:'Adventure',story:'Disposable local sync check.',trip:'',rating:0,cost:'',favorite:false,lat:null,lng:null,photos:[{id:photoId,caption:'Synced photo',file:new File([bytes],'sync.jpg',{type:'image/jpeg'})}]};
let created=false;
try{
 assert.equal((await nativeFetch(origin+'/api/albums')).status,401,'anonymous album reads are blocked');
 assert.equal((await nativeFetch(origin+'/api/albums',{method:'POST'})).status,401,'anonymous album writes are blocked');
 await cloudJournal.saveAlbum({place,country:'Nepal'});
 await cloudJournal.saveAlbum({place:' '+place.toUpperCase()+' ',country:'Nepal'});
 const invalid=await fetch('/api/albums',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({place:' ',country:''})});
 assert.equal(invalid.status,400);
 const crossOrigin=await fetch('/api/albums',{method:'POST',headers:{origin:'https://other.example','Content-Type':'application/json'},body:JSON.stringify({place,country:'Nepal'})});
 assert.equal(crossOrigin.status,403);
 await cloudJournal.save(entry);created=true;
 client=1;
 const albums=(await cloudJournal.listAlbums()).filter(album=>album.place.toLowerCase()===place.toLowerCase());
 assert.equal(albums.length,1,'a separate session sees the saved folder with normalized deduplication');
 const reopened=(await cloudJournal.list()).find(saved=>saved.id===id);
 assert.equal(reopened.photos[0].caption,'Synced photo','a separate session sees uploaded metadata');
 const photo=await fetch(`/api/photos/${id}/${photoId}`);
 assert.equal(photo.status,200);assert.deepEqual(Buffer.from(await photo.arrayBuffer()),bytes,'a separate session retrieves the real saved photo');
 await cloudJournal.save({...reopened,favorite:true});
 client=0;
 assert.equal((await cloudJournal.list()).find(saved=>saved.id===id).favorite,true,'changes in the second session are visible in the first');
 console.log('PASS: real local cloud adapter, two sessions, album persistence/deduplication, JPEG retrieval, edits, anonymous denial, validation and cross-origin write rejection.');
}finally{
 if(created)await cloudJournal.remove(id);
 globalThis.fetch=nativeFetch;
 const result=spawnSync(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','dist/server/wrangler.json','--persist-to','.wrangler/state','--command',`DELETE FROM album_folders WHERE owner = 'journal-owner' AND lower(place) = '${place.toLowerCase()}'`],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
}
