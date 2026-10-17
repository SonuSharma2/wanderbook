import type { Entry } from '../app/journal';
import type { JournalRepository } from '../app/journal-repository';

type StoredPhoto={id:string;caption:string;blob:Blob};
type StoredEntry=Omit<Entry,'photos'> & {photos:StoredPhoto[];revision:string};

const storageError=(error:unknown)=>error instanceof DOMException&&error.name==='QuotaExceededError'
 ?new Error('This browser is out of storage. Back up your journal, then free some space before saving more photos.')
 :error instanceof Error?error:new Error('This browser could not save your journal. Check that browser storage is enabled.');

export function createBrowserJournal(databaseName='wanderbook-device-journal-v1'):JournalRepository{
 let connection:Promise<IDBDatabase>|undefined;
 const urls=new Map<string,string>();
 const open=()=>connection??=(new Promise<IDBDatabase>((resolve,reject)=>{
  if(typeof indexedDB==='undefined'){reject(new Error('Browser storage is unavailable. Use a browser with IndexedDB enabled.'));return}
  const request=indexedDB.open(databaseName,1);
  request.onupgradeneeded=()=>request.result.createObjectStore('entries',{keyPath:'id'});
  request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>{db.close();connection=undefined};resolve(db)};
  request.onerror=()=>{connection=undefined;reject(storageError(request.error))};
  request.onblocked=()=>{connection=undefined;reject(new Error('Close other Wanderbook tabs and try again.'))};
 }));
 const transaction=async<T>(mode:IDBTransactionMode,operation:(store:IDBObjectStore)=>IDBRequest<T>)=>{
  const db=await open();
  return new Promise<T>((resolve,reject)=>{
   const tx=db.transaction('entries',mode),request=operation(tx.objectStore('entries'));
   tx.oncomplete=()=>resolve(request.result);
   tx.onabort=()=>reject(storageError(tx.error||request.error));
   tx.onerror=()=>reject(storageError(tx.error||request.error));
  });
 };
 const release=(id:string)=>{for(const [key,url] of urls)if(key.startsWith(id+'/')){URL.revokeObjectURL(url);urls.delete(key)}};
 const hydrate=(record:StoredEntry):Entry=>{
  const {revision,photos,...entry}=record;
  return {...entry,photos:photos.map(photo=>{
   const key=`${record.id}/${photo.id}/${revision}`;
   if(!urls.has(key))urls.set(key,URL.createObjectURL(photo.blob));
   return {id:photo.id,caption:photo.caption,url:urls.get(key)!};
  })};
 };
 return {
  async list(){const records=await transaction<StoredEntry[]>('readonly',store=>store.getAll());return records.sort((a,b)=>b.date.localeCompare(a.date)).map(hydrate)},
  async save(entry){
   if(!entry.id||typeof entry.title!=='string'||!entry.title.trim()||typeof entry.location!=='string'||!entry.location.trim()||typeof entry.country!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(entry.date)||!Array.isArray(entry.photos)||entry.photos.length>24)throw new Error('Add a title, place and date, with up to 24 photos.');
   if(!['Trekking','Roaming','Food & cafés'].includes(entry.category)||!['Adventure','Peaceful','With friends','Solo','Food hunt'].includes(entry.mood)||typeof entry.story!=='string'||typeof entry.trip!=='string'||typeof entry.cost!=='string'||typeof entry.favorite!=='boolean')throw new Error('The memory contains invalid details.');
   if((entry.lat===null)!==(entry.lng===null)||(entry.lat!==null&&(!Number.isFinite(entry.lat)||entry.lat< -90||entry.lat>90))||(entry.lng!==null&&(!Number.isFinite(entry.lng)||entry.lng< -180||entry.lng>180)))throw new Error('Enter valid latitude and longitude coordinates, or leave both blank.');
   const previous=await transaction<StoredEntry|undefined>('readonly',store=>store.get(entry.id));
   const ids=new Set<string>();
   const photos=entry.photos.map(photo=>{
    if(!photo.id||ids.has(photo.id)||typeof photo.caption!=='string')throw new Error('The photo list is invalid.');ids.add(photo.id);
    const blob=photo.file||previous?.photos.find(saved=>saved.id===photo.id)?.blob;
    if(!blob)throw new Error('A photo is missing. Choose the photo again before saving.');
    if(!['image/jpeg','image/png','image/webp','image/avif'].includes(blob.type)||blob.size>8*1024*1024)throw new Error('Choose JPG, PNG, WebP or AVIF photos smaller than 8 MB after resizing.');
    return {id:photo.id,caption:photo.caption,blob};
   });
   const record:StoredEntry={...entry,photos,revision:crypto.randomUUID()};
   await transaction('readwrite',store=>store.put(record));
   release(entry.id);return hydrate(record);
  },
  async remove(id){await transaction('readwrite',store=>store.delete(id));release(id)}
 };
}
