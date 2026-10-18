import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolveObjectURL} from 'node:buffer';
import {Worker as NodeWorker} from 'node:worker_threads';
import {build} from 'esbuild';

await build({entryPoints:['app/photo-upload.ts'],outfile:'.sites-runtime/photo-upload-check.mjs',bundle:true,platform:'node',format:'esm',packages:'external',logLevel:'warning'});
const {isHeicPhoto,preparePhoto,PHOTO_UPLOAD_ACCEPT}=await import('../.sites-runtime/photo-upload-check.mjs');
assert.ok(PHOTO_UPLOAD_ACCEPT.includes('.heic')&&PHOTO_UPLOAD_ACCEPT.includes('.heif'));
for(const file of [{name:'IMG_1234.HEIC',type:''},{name:'photo.heif',type:'application/octet-stream'},{name:'photo',type:'image/heic'},{name:'photo',type:'image/heif-sequence'}])assert.equal(isHeicPhoto(file),true);
assert.equal(isHeicPhoto({name:'photo.avif',type:'image/avif'}),false);

// Run the actual bundled libheif decoder in a Node worker. Only browser APIs
// (Worker bridge, ImageBitmap and canvas JPEG encoding) are emulated here.
const workers=[];
globalThis.Worker=class extends EventTarget{
 constructor(url){
  super();workers.push(this);
  const source=resolveObjectURL(url);assert.ok(source);
  this.ready=source.text().then(code=>{
   this.worker=new NodeWorker(`
    const {parentPort}=require('node:worker_threads');
    globalThis.ImageData=class{constructor(width,height){this.width=width;this.height=height;this.data=new Uint8ClampedArray(width*height*4)}};
    globalThis.postMessage=data=>parentPort.postMessage(data);
    globalThis.onmessage=null;
    parentPort.on('message',data=>globalThis.onmessage({data}));
    ${code}
   `,{eval:true});
   this.worker.on('message',data=>{const event=new Event('message');event.data=data;this.dispatchEvent(event)});
   this.worker.on('error',error=>{const event=new Event('error');event.data=error;this.dispatchEvent(event)});
  });
 }
 postMessage(data){void this.ready.then(()=>this.worker.postMessage(data))}
};

const jpeg=await readFile('public/photos/trek.jpg');
const heic=await readFile('scripts/fixtures/two-colors.heic');
let nativeSupported=false,closed=0,decoded,drawn,canvas;
globalThis.createImageBitmap=async input=>{
 if(input instanceof Blob){if(!nativeSupported)throw Error('No native HEIC decoder');return {width:4400,height:3300,close(){closed++}}}
 decoded=input;return {...input,close(){closed++}};
};
globalThis.document={createElement(name){assert.equal(name,'canvas');canvas={width:0,height:0,getContext(){return {drawImage(bitmap,x,y,width,height){drawn={width,height}}}},toBlob(callback,type,quality){assert.equal(type,'image/jpeg');assert.equal(quality,.88);callback(new Blob([jpeg],{type}))}};return canvas}};

try{
 let converting=0;
 const result=await preparePhoto(new File([heic],'IMG_1234.HEIC',{type:''}),()=>converting++);
 assert.equal(converting,1,'unsupported browsers load the fallback decoder');
 assert.equal(result.type,'image/jpeg');assert.equal(result.name,'IMG_1234.jpg');
 assert.equal(decoded.width,64);assert.equal(decoded.height,48);
 const pixel=(x,y)=>Array.from(decoded.data.slice((y*64+x)*4,(y*64+x)*4+4));
 const left=pixel(8,24),right=pixel(56,24);
 assert.ok(left[0]>180&&left[1]<80&&right[0]<80&&right[1]>140,'real HEIC decoding preserves the two-colour fixture');
 assert.deepEqual(drawn,{width:64,height:48});assert.equal(closed,1);assert.equal(canvas.width,1,'canvas memory is released');
 assert.deepEqual(Buffer.from(await result.arrayBuffer()),jpeg,'encoded JPEG bytes become the upload file');

 nativeSupported=true;
 const native=await preparePhoto(new File([heic],'native.heif',{type:'image/heif'}),()=>converting++);
 assert.equal(native.name,'native.jpg');assert.equal(converting,1,'native HEIC support avoids the fallback');
 assert.deepEqual(drawn,{width:2200,height:1650},'large iPhone photos are resized');
 assert.equal(closed,2);
 nativeSupported=false;
 await assert.rejects(()=>preparePhoto(new File(['bad'],'broken.heic',{type:'image/heic'})),/Could not convert this HEIC\/HEIF photo/);
 await assert.rejects(()=>preparePhoto(new File(['bad'],'video.mov',{type:'video/quicktime'})),/Choose JPG/);
 await assert.rejects(()=>preparePhoto(new File([],'empty.heic')),/is empty/);
 await assert.rejects(()=>preparePhoto(new File([new Uint8Array(25*1024*1024+1)],'large.heic')),/25 MB/);
 console.log('PASS: actual HEIC decoder pixels, native HEIC path, missing MIME/uppercase HEIC/HEIF acceptance, JPEG output, resizing, cleanup and corrupt/oversized/unsupported file feedback. Browser image and canvas APIs are emulated.');
}finally{
 await Promise.all(workers.map(async worker=>{await worker.ready;await worker.worker.terminate()}));
}
