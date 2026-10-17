import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

// Integration checks run only against the isolated local development journal.
const origin = 'http://127.0.0.1:5173';
const login = await fetch(origin + '/signin-with-chatgpt?return_to=/', { redirect: 'manual' });
const cookie = login.headers.getSetCookie().map(v => v.split(';')[0]).join('; ');
assert.ok(cookie, 'local sign-in sets a session');
const authed = (url, init = {}) => fetch(origin + url, { ...init, headers: { cookie, ...init.headers } });
assert.equal((await fetch(origin + '/')).status, 200, 'home responds');
assert.equal((await fetch(origin + '/api/entries')).status, 401, 'anonymous journal reads rejected');
assert.equal((await fetch(origin + '/api/entries', {method:'POST'})).status, 401, 'anonymous writes rejected');
const id = randomUUID(), photoId = randomUUID();
const entry = { id, title:'Integration test — a morning in the mountains', location:'Test trail', country:'Nepal', date:'2026-10-17',category:'Trekking',mood:'Adventure',story:'A local disposable smoke test.',trip:'Local QA',rating:5,cost:'NPR 500',favorite:false,lat:28.53,lng:83.87,photos:[{id:photoId,caption:'Original caption'}] };
const bytes = await readFile(new URL('../public/photos/trek.jpg',import.meta.url));
let created = false;
try {
  const form = new FormData();form.set('entry',JSON.stringify(entry));form.set(photoId,new Blob([bytes],{type:'image/jpeg'}),'test.jpg');
  const saved = await authed('/api/entries',{method:'POST',body:form});
  assert.equal(saved.status,200,await saved.clone().text());created=true;
  assert.equal((await saved.json()).title,entry.title,'memory saved');
  const listing=await (await authed('/api/entries')).json();
  assert.ok(listing.some(e=>e.id===id&&e.photos[0].caption==='Original caption'),'entry persists on fresh fetch');
  const photo=await authed(`/api/photos/${id}/${photoId}`);
  assert.equal(photo.status,200,'saved photo is served');
  assert.equal(photo.headers.get('content-type'),'image/jpeg');
  assert.deepEqual(Buffer.from(await photo.arrayBuffer()),bytes,'photo survives upload without data loss');
  assert.equal((await fetch(origin+`/api/photos/${id}/${photoId}`)).status,401,'anonymous photo reads rejected');
  const changed={...entry,category:'Food & cafés',favorite:true,title:'Updated local test',photos:[{id:photoId,caption:'Updated caption'}]};
  const updateForm=new FormData();updateForm.set('entry',JSON.stringify(changed));
  const updated=await authed('/api/entries',{method:'POST',body:updateForm});
  assert.equal(updated.status,200,await updated.clone().text());
  const stored=await updated.json();assert.equal(stored.favorite,true);assert.equal(stored.photos[0].caption,'Updated caption');assert.equal(stored.category,'Food & cafés','café category round-trips correctly');
  const csrfForm=new FormData();csrfForm.set('entry',JSON.stringify(entry));
  assert.equal((await authed('/api/entries',{method:'POST',body:csrfForm,headers:{origin:'https://other.example'}})).status,403,'cross-origin writes rejected');
  const bad=new FormData();bad.set('entry',JSON.stringify({...entry,title:''}));
  assert.equal((await authed('/api/entries',{method:'POST',body:bad})).status,400,'invalid entries rejected');
  assert.equal((await authed(`/api/entries/${id}`,{method:'DELETE'})).status,200,'memory deletes');created=false;
  assert.equal((await authed(`/api/photos/${id}/${photoId}`)).status,404,'deleted photos removed from storage');
  assert.ok(!(await (await authed('/api/entries')).json()).some(e=>e.id===id),'deleted memory removed');
  console.log('PASS: home, local sign-in, upload, storage round-trip, update, validation, private access, CSRF protection, deletion, photo cleanup.');
} finally {if(created)await authed(`/api/entries/${id}`,{method:'DELETE'})}
