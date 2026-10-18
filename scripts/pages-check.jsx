import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import 'fake-indexeddb/auto';
import React,{act} from 'react';
import { Window } from 'happy-dom';
import { createBrowserJournal } from '../github-pages/browser-journal';
import Journal from '../app/journal';
import { assetUrl } from '../app/assets';
import { albumImage, groupPlaceAlbums, mergeAlbumFolders } from '../app/albums';
import { CLOUD_JOURNAL_URL } from '../app/cloud-link';

assert.equal(assetUrl('/photos/trek.jpg'),'/wanderbook/photos/trek.jpg');
assert.equal(assetUrl('blob:local-photo'),'blob:local-photo');
assert.equal(assetUrl('https://example.com/photo.jpg'),'https://example.com/photo.jpg');

const bytes=await readFile('public/photos/trek.jpg');
const databaseName='wanderbook-test-'+crypto.randomUUID();
const repository=createBrowserJournal(databaseName);
const entry={id:crypto.randomUUID(),title:'A saved walk',location:'A trail',country:'Nepal',date:'2026-10-17',category:'Trekking',mood:'Adventure',story:'A note to keep.',trip:'A weekend',rating:4,cost:'',favorite:false,lat:28,lng:84,photos:[{id:crypto.randomUUID(),caption:'Our first photo',file:new File([bytes],'walk.jpg',{type:'image/jpeg'})}]};
assert.deepEqual(await repository.list(),[]);
let saved=await repository.save(entry);
assert.equal(saved.photos[0].file,undefined,'persisted UI entries use durable photo URLs rather than editor files');
assert.ok(saved.photos[0].url?.startsWith('blob:'));
assert.deepEqual(Buffer.from(await(await fetch(saved.photos[0].url)).arrayBuffer()),bytes,'uploaded JPEG bytes survive IndexedDB');
assert.equal(albumImage({entry:saved,photo:saved.photos[0]}),saved.photos[0].url);

const reopened=createBrowserJournal(databaseName);
let restored=(await reopened.list())[0];
assert.equal(restored.title,entry.title,'a new repository instance can reopen saved records');
assert.deepEqual(Buffer.from(await(await fetch(restored.photos[0].url)).arrayBuffer()),bytes);
saved=await repository.save({...saved,title:'An edited walk',favorite:true});
assert.equal((await reopened.list())[0].favorite,true,'metadata edits retain original photos');
const second={id:crypto.randomUUID(),caption:'Another frame',file:new File([bytes],'second.jpg',{type:'image/jpeg'})};
saved=await repository.save({...saved,photos:[second,...saved.photos]});
assert.equal(saved.photos[0].id,second.id,'chosen photo order and cover persist');
await assert.rejects(()=>repository.save({...saved,lat:91}),/coordinates/);
await assert.rejects(()=>repository.save({...saved,photos:[...saved.photos,saved.photos[0]]}),/photo list/);
await assert.rejects(()=>repository.save({...saved,photos:[{id:'missing',caption:'Missing bytes'}]}),/photo is missing/);
await assert.rejects(()=>repository.save({...saved,photos:[{id:'bad',caption:'Bad file',file:new File(['bad'],'bad.svg',{type:'image/svg+xml'})}]}),/Choose JPG/);
assert.equal((await reopened.list())[0].photos.length,2,'rejected saves leave the previous memory intact');
saved=await repository.save({...saved,photos:saved.photos.slice(1)});
assert.equal((await reopened.list())[0].photos.length,1,'removed photos stay removed');

const backupPhoto=new File([await(await fetch(saved.photos[0].url)).blob()],'backup.jpg',{type:'image/jpeg'});
const imported=await repository.save({...saved,id:crypto.randomUUID(),favorite:false,photos:[{id:crypto.randomUUID(),caption:'Restored from backup',file:backupPhoto}]});
assert.equal((await repository.list()).length,2,'a backup can restore as a separate memory');
await repository.remove(saved.id);
assert.equal((await reopened.list()).length,1);

// Exercise the real Journal with the browser repository and reject backend calls.
const window=new Window({url:'https://sonusharma2.github.io/wanderbook/'});
for(const key of ['document','HTMLElement','HTMLDialogElement','Node','Element','Event','MouseEvent','KeyboardEvent','PointerEvent'])Object.defineProperty(globalThis,key,{configurable:true,value:window[key]});
Object.defineProperty(globalThis,'window',{configurable:true,value:window});
Object.defineProperty(globalThis,'localStorage',{configurable:true,value:window.localStorage});
Object.defineProperty(globalThis,'navigator',{configurable:true,value:window.navigator});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
window.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};
window.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')};
globalThis.ResizeObserver=class{observe(){}disconnect(){}};
const intervalCallbacks=new Map();let intervalId=0;
window.setInterval=callback=>{intervalCallbacks.set(++intervalId,callback);return intervalId};
globalThis.clearInterval=window.clearInterval=id=>intervalCallbacks.delete(id);
const originalFetch=globalThis.fetch;let backendRequests=0;
globalThis.fetch=(url,options)=>{if(String(url).includes('/api/')){backendRequests++;throw Error('Pages attempted a backend request')}return originalFetch(url,options)};
const {createRoot}=await import('react-dom/client');
const container=document.createElement('main');document.body.append(container);const root=createRoot(container);
const settle=async()=>act(async()=>{await new Promise(resolve=>setTimeout(resolve,40))});
const click=async(element)=>{assert.ok(element);await act(async()=>element.click());await settle()};
await act(async()=>root.render(<Journal signedIn name="Traveler" repository={reopened}/>));await settle();
assert.match(container.querySelector('.device-storage-note').textContent,/Saved on this device/);
assert.equal(container.querySelectorAll('.memory-card').length,1,'Pages opens saved personal entries');
await click(container.querySelector('.card-heart'));
assert.equal((await reopened.list())[0].favorite,true,'favorite changes use browser storage');
await click(container.querySelector('.card-title'));
const textButton=(text)=>[...container.querySelectorAll('button')].find(button=>button.textContent?.trim()===text)||null;
await click(textButton('Delete memory'));await click(textButton('Yes, delete'));
assert.equal((await reopened.list()).length,0,'confirmed deletion works without a server');

const starterAlbums=[{place:'Panchpokhari',country:''}];
const emptyAlbum=groupPlaceAlbums([],starterAlbums)[0];
assert.equal(emptyAlbum.memories.length,0,'creating an album does not invent a visit');
assert.equal(emptyAlbum.latest,'','empty albums have no invented travel date');
assert.equal(groupPlaceAlbums([{...entry,location:'Panchpokhari'}],starterAlbums).length,1,'adding a country does not duplicate the starter album');
assert.equal(mergeAlbumFolders(starterAlbums,[{place:'  PANCHPOKHARI ',country:''}]).length,1,'album names are normalized');
await assert.rejects(async()=>mergeAlbumFolders([{place:' ',country:''}]),/valid album/);

window.location.href='https://sonusharma2.github.io/wanderbook/?album=Panchpokhari';
await act(async()=>root.render(<Journal key="panchpokhari" signedIn name="Traveler" repository={reopened} starterAlbums={starterAlbums}/>));await settle();
assert.equal(container.querySelectorAll('.place-album').length,1,'Panchpokhari appears in the personal album shelf');
assert.ok(container.querySelector('dialog[aria-label="Panchpokhari photo album"]'),'direct album links open Panchpokhari');
assert.doesNotMatch(container.textContent,/Invalid Date/);
assert.equal((await reopened.list()).length,0,'the empty album stores no fake memory');
let downloadUrl='';
const originalAnchorClick=window.HTMLAnchorElement.prototype.click;
window.HTMLAnchorElement.prototype.click=function(){downloadUrl=this.href};
await click(textButton('Back up journal'));
assert.deepEqual((await(await fetch(downloadUrl)).json()).albums,starterAlbums,'empty album folders are included in backups');
window.HTMLAnchorElement.prototype.click=originalAnchorClick;
await click(textButton('Upload photos'));
assert.ok(container.querySelector('dialog[aria-label="Upload photos to Panchpokhari"]'));
const editor=container.querySelector('.editor-modal');
assert.equal(editor.querySelector('input[maxlength="120"]').value,'Panchpokhari');
assert.equal(editor.querySelector('input[maxlength="150"]').value,'Panchpokhari','album uploads preselect the correct place');
const submit=async(form)=>{await act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await settle()};
await submit(editor.querySelector('form'));
assert.match(editor.querySelector('[role="alert"]').textContent,/at least one photo/,'empty uploads cannot create a memory');

// Emulate image decoding/canvas only; the real editor, File handling and IndexedDB save run below.
globalThis.createImageBitmap=async()=>({width:1200,height:800,close(){}});
window.HTMLCanvasElement.prototype.getContext=()=>({drawImage(){}});
window.HTMLCanvasElement.prototype.toBlob=callback=>callback(new Blob([bytes],{type:'image/jpeg'}));
const photoInput=editor.querySelector('input[type="file"]');
assert.ok(photoInput.accept.includes('.heic')&&photoInput.accept.includes('.heif'),'the picker offers iPhone HEIC and HEIF files');
const heicBytes=await readFile('scripts/fixtures/two-colors.heic');
Object.defineProperty(photoInput,'files',{configurable:true,value:[new File([bytes],'panchpokhari-test.jpg',{type:'image/jpeg'}),new File([heicBytes],'IPHONE.HEIC',{type:''})]});
await act(async()=>photoInput.dispatchEvent(new window.Event('change',{bubbles:true})));await settle();
assert.equal(editor.querySelectorAll('.edit-photo').length,2,'mixed JPG and HEIC selections appear in the upload editor');
await submit(editor.querySelector('form'));
assert.equal(container.querySelectorAll('.album-photo-button').length,2,'saving mixed formats returns to the same Panchpokhari album');
const uploaded=(await reopened.list())[0];
assert.equal(uploaded.location,'Panchpokhari');
assert.deepEqual(Buffer.from(await(await fetch(uploaded.photos[0].url)).arrayBuffer()),bytes,'album upload preserves photo bytes');
assert.equal((await(await fetch(uploaded.photos[1].url)).blob()).type,'image/jpeg','HEIC is stored as a universally viewable JPEG');
await click(container.querySelector('[aria-label="Close place album"]'));
await click(textButton('Create album'));
const nameInput=container.querySelector('.create-album-modal input');
await act(async()=>{Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(nameInput,'Rara');nameInput.dispatchEvent(new window.Event('input',{bubbles:true}))});
await submit(container.querySelector('.create-album-modal form'));
assert.equal(JSON.parse(localStorage.getItem('wanderbook-albums')).some(album=>album.place==='Rara'),true,'new empty albums persist without fake entries');
await act(async()=>root.render(<Journal key="reopened-albums" signedIn name="Traveler" repository={reopened} starterAlbums={starterAlbums}/>));await settle();
assert.equal(container.querySelectorAll('.place-album').length,2,'created albums and uploaded photos survive reopening');
assert.ok(container.querySelector('.album-cover-photo'),'Panchpokhari gets an uploaded cover photo');
assert.ok(container.querySelector('[aria-label="Watch stories: Panchpokhari"]'),'uploaded album photos become stories');
const restoreInput=container.querySelector('footer input[type="file"]');
Object.defineProperty(restoreInput,'files',{configurable:true,value:[new File([JSON.stringify({app:'wanderbook',version:1,entries:[],albums:[{place:'Langtang',country:'Nepal'}]})],'albums.json',{type:'application/json'})]});
await act(async()=>restoreInput.dispatchEvent(new window.Event('change',{bubbles:true})));await settle();
assert.equal(container.querySelectorAll('.place-album').length,3,'restoring an album-only backup restores empty folders');
assert.equal((await reopened.list()).length,1,'restoring empty folders leaves saved photos intact');
assert.equal(backendRequests,0,'no cloud API is called in Pages mode');

// Cloud UI reads server records rather than the prior device's localStorage.
let cloudEntries=[],cloudFolders=[];
globalThis.fetch=async(path,options={})=>{
 if(path==='/api/entries'){
  if(options.method==='POST'){const entry=JSON.parse(options.body.get('entry'));cloudEntries=[entry,...cloudEntries.filter(saved=>saved.id!==entry.id)];return Response.json(entry)}
  return Response.json(cloudEntries);
 }
 if(path==='/api/albums'){
  if(options.method==='POST'){const folder=JSON.parse(options.body);cloudFolders.push(folder);return Response.json(folder)}
  return Response.json(cloudFolders);
 }
 return originalFetch(path,options);
};
window.location.href=CLOUD_JOURNAL_URL+'/?restore=1';
await act(async()=>root.render(<Journal key="cloud-laptop" signedIn name="My account" starterAlbums={starterAlbums}/>));await settle();
assert.ok(container.querySelector('.cloud-storage-note'),'cloud account status replaces the device notice');
assert.equal(container.querySelectorAll('.place-album').length,1,'device folders are not mistaken for cloud folders');
assert.ok(container.querySelector('dialog[aria-label="Import device journal"]'),'migration link opens the import flow');
const cloudImport=container.querySelector('footer input[type="file"]');
Object.defineProperty(cloudImport,'files',{configurable:true,value:[new File([JSON.stringify({app:'wanderbook',version:1,albums:[{place:'Synced folder',country:'Nepal'}],entries:[{...entry,location:'Panchpokhari',photos:[{id:entry.photos[0].id,caption:'Imported cloud photo',dataUrl:'data:image/jpeg;base64,'+bytes.toString('base64')}]}]})],'device.json',{type:'application/json'})]});
await act(async()=>cloudImport.dispatchEvent(new window.Event('change',{bubbles:true})));await settle();
assert.equal(cloudEntries.length,1,'device backup uploads entries into the signed-in cloud repository');
assert.equal(cloudEntries[0].id,entry.id,'migration keeps the original memory ID so a retry updates the same record');
assert.equal(cloudEntries[0].photos[0].id,entry.photos[0].id,'migration keeps stable photo IDs');
assert.equal(cloudFolders[0].place,'Synced folder','device backup saves folder metadata in the cloud');
assert.equal(container.querySelector('dialog[aria-label="Import device journal"]'),null,'successful migration closes the import dialog');
await act(async()=>root.render(<Journal key="cloud-phone" signedIn name="My account" starterAlbums={starterAlbums}/>));await settle();
assert.equal(container.querySelectorAll('.memory-card').length,1,'a second cloud UI instance loads the server journal');
assert.equal(container.querySelectorAll('.place-album').length,2,'a second cloud UI instance loads server albums');
cloudEntries.push({...cloudEntries[0],id:crypto.randomUUID(),title:'A phone upload'});
await click(container.querySelector('[aria-label="Refresh cloud journal"]'));
assert.equal(container.querySelectorAll('.memory-card').length,2,'refresh retrieves new records from another device');
cloudEntries=[];
await act(async()=>window.dispatchEvent(new window.Event('focus')));await settle();
assert.equal(container.querySelectorAll('.memory-card').length,0,'returning to the tab refreshes cloud records');
globalThis.fetch=async()=>Response.json({error:'Session expired'},{status:401});
await click(container.querySelector('[aria-label="Refresh cloud journal"]'));
assert.match(container.querySelector('[role="alert"]').textContent,/session expired/i,'expired sessions are surfaced instead of showing a false sync success');
await act(async()=>root.unmount());
assert.equal(intervalCallbacks.size,0,'page animation timers clean up');
globalThis.fetch=originalFetch;
window.happyDOM.abort();
console.log('PASS: device journal persistence, albums/uploads, cloud migration/import, server folders, second cloud UI instance, manual/focus refresh, expired-session feedback, links and timer cleanup. DOM, IndexedDB, cloud HTTP and image decoding/canvas are emulated.');
