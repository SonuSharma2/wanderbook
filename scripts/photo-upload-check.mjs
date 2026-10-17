import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { groupPlaceAlbums } from '../app/albums.ts';

// Exercise real D1/R2 uploads only on the isolated, loopback development server.
const origin='http://127.0.0.1:5173';
const login=await fetch(origin+'/signin-with-chatgpt?return_to=/',{redirect:'manual'});
const cookie=login.headers.getSetCookie().map(v=>v.split(';')[0]).join('; ');
assert.ok(cookie);
const request=(path,init={})=>fetch(origin+path,{...init,headers:{cookie,...init.headers}});
const assets=new URL('../public/photos/',import.meta.url);
const files=(await readdir(assets)).filter(f=>f.endsWith('.jpg'));
assert.equal(files.length,12,'sample image collection is complete');
const created=[];let checked=0;
try{
  for(let start=0;start<files.length;start+=3){
    const id=randomUUID();
    const fixture={id,title:`Photo QA ${start/3+1}`,location:start<6?'QA Repeat Visit':'QA Different Place',country:'Test only',date:start===0?'2025-01-01':'2026-10-17',category:'Roaming',mood:'Peaceful',story:'Disposable local image verification.',trip:'Local QA',rating:5,cost:'',favorite:false,lat:27.7,lng:85.3,photos:[]};
    const form=new FormData();const originals=new Map();
    for(const name of files.slice(start,start+3)){
      const bytes=await readFile(new URL(name,assets));
      const metadata=await sharp(bytes).metadata();assert.ok(metadata.width>0&&metadata.height>0,`${name} decodes`);assert.equal(metadata.format,'jpeg');
      const photo={id:randomUUID(),caption:`QA sample: ${name}`};fixture.photos.push(photo);originals.set(photo.id,bytes);form.set(photo.id,new Blob([bytes],{type:'image/jpeg'}),name);
    }
    form.set('entry',JSON.stringify(fixture));
    const saved=await request('/api/entries',{method:'POST',body:form});assert.equal(saved.status,200,await saved.clone().text());created.push(id);
    for(const photo of fixture.photos){
      const response=await request(`/api/photos/${id}/${photo.id}`);assert.equal(response.status,200);const bytes=Buffer.from(await response.arrayBuffer());assert.deepEqual(bytes,originals.get(photo.id));await sharp(bytes).metadata();checked++;
    }
  }
  const entries=(await(await request('/api/entries')).json()).filter(e=>created.includes(e.id));
  assert.equal(entries.length,4,'all multi-photo memories persist');
  const albums=groupPlaceAlbums(entries);assert.equal(albums.length,2);assert.ok(albums.every(a=>a.photos.length===6),'repeat-visit albums contain every uploaded photo');
  console.log(`PASS: ${checked} actual JPEG files decode, upload, persist in local R2, retrieve byte-for-byte, and group across repeated visits.`);
}finally{
  for(const id of created){const response=await request(`/api/entries/${id}`,{method:'DELETE'});assert.equal(response.status,200,'local QA photos clean up');}
}
