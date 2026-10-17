import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const hosted=process.argv.includes('--hosted');
async function credentials(){
 if(!hosted)return {origin:'http://127.0.0.1:5173',key:''};
 process.stdin.setEncoding('utf8');process.stdin.setRawMode?.(true);process.stdin.resume();
 console.log('Ready for temporary upload check JSON on stdin (input is hidden).');
 return new Promise((resolve,reject)=>{
  let data='';
  process.stdin.on('data',chunk=>{
   data+=chunk;
   if(data.includes('\n')){
    process.stdin.pause();process.stdin.setRawMode?.(false);
    try{resolve(JSON.parse(data.trim()))}catch{reject(Error('Invalid upload check input.'))}
   }
  });
 });
}
const {origin,key}=await credentials();
if(hosted)assert.equal(origin,'https://wanderbook-travel-stories.copperbowl.chatgpt.site','hosted tests are restricted to this journal');
const browserHeaders={'User-Agent':'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1','Accept':'application/json'};
let cookie='';
if(!hosted){const login=await fetch(origin+'/signin-with-chatgpt?return_to=/',{redirect:'manual'});cookie=login.headers.getSetCookie().map(value=>value.split(';')[0]).join('; ');assert.ok(cookie)}
const owned=(path,options={})=>fetch(origin+path,{...options,headers:{...browserHeaders,...options.headers,Origin:origin,...(hosted?{Authorization:'Bearer '+key}:{Cookie:cookie})}});
const guest=(path,options={})=>fetch(origin+path,{...options,headers:{...browserHeaders,...options.headers}});
const bytes=await readFile('public/photos/trek.jpg'),created=[];
const privatePlace='Private upload check '+crypto.randomUUID();let shareCreated=false;
async function upload(location){
 const id=crypto.randomUUID(),photo=crypto.randomUUID();
 const entry={id,title:'Temporary sample upload check',location,country:'Nepal',date:'2026-10-17',category:'Trekking',mood:'Adventure',story:'PRIVATE_STORY_SENTINEL',trip:'PRIVATE_TRIP_SENTINEL',rating:0,cost:'PRIVATE_COST_SENTINEL',favorite:false,lat:28,lng:84,photos:[{id:photo,caption:'Temporary illustrative sample used to verify cloud uploads.'}]};
 const form=new FormData();form.set('entry',JSON.stringify(entry));form.set(photo,new Blob([bytes],{type:'image/jpeg'}),'upload-check.jpg');
 const response=await owned('/api/entries',{method:'POST',body:form});assert.equal(response.status,200,'authorized upload succeeds');created.push(id);return {id,photo};
}
try{
 for(const path of ['/api/entries','/api/albums'])assert.equal((await guest(path)).status,401,'private journal metadata requires authorization');
 assert.equal((await guest('/api/entries',{method:'POST'})).status,401,'anonymous uploads are denied');
 assert.equal((await guest('/api/shares',{method:'POST'})).status,401,'anonymous sharing changes are denied');
 const shared=await upload('Panchpokhari'),privateEntry=await upload(privatePlace);
 const listing=await guest('/api/shared/panchpokhari');assert.equal(listing.status,200,'a shared album opens without sign-in');
 const album=await listing.json(),text=JSON.stringify(album);
 assert.ok(!/PRIVATE_(STORY|TRIP|COST)_SENTINEL/.test(text),'shared DTO excludes journal notes, trip and cost');
 const frame=album.photos.find(photo=>photo.id===shared.id+'-'+shared.photo);assert.ok(frame,'the uploaded photo appears in the shared album');
 const image=await guest(frame.url);assert.equal(image.status,200);assert.deepEqual(Buffer.from(await image.arrayBuffer()),bytes,'anonymous photo bytes match the uploaded JPEG');
 assert.match(image.headers.get('cache-control'),/no-store/,'revoked images cannot remain in a public cache');
 assert.equal((await guest(`/api/shared/panchpokhari/photos/${privateEntry.id}/${privateEntry.photo}`)).status,404,'an album link cannot read another album photo');
 const page=await guest('/album/panchpokhari',{headers:{Accept:'text/html'}});assert.equal(page.status,200);assert.match(await page.text(),/No account needed/,'mobile public page renders without authentication');
 const linkResponse=await owned('/api/shares',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({place:privatePlace,country:'Nepal'})});assert.equal(linkResponse.status,200);shareCreated=true;
 const link=await linkResponse.json(),token=new URL(link.url).pathname.split('/').pop();
 assert.equal((await guest('/api/shared/'+token)).status,200,'a separately shared album gets its own working link');
 await owned('/api/shares',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({place:privatePlace,country:'Nepal'})});shareCreated=false;
 assert.equal((await guest('/api/shared/'+token)).status,404,'turning off sharing revokes the album');
 assert.equal((await guest(`/api/shared/${token}/photos/${privateEntry.id}/${privateEntry.photo}`)).status,404,'turning off sharing revokes direct photo URLs');
 assert.equal((await guest('/api/shared/not-a-share')).status,404,'unknown links are rejected');
 console.log('PASS: actual JPEG upload, database metadata, anonymous mobile album page, exact public photo bytes, private journal/write denial, album isolation, minimal shared metadata, separate links and revocation.');
}finally{
 if(shareCreated)await owned('/api/shares',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({place:privatePlace,country:'Nepal'})});
 for(const id of created){const response=await owned('/api/entries/'+id,{method:'DELETE'});assert.equal(response.status,200,'temporary upload cleanup succeeds')}
 console.log('Temporary test memories and photo files removed.');
}
