import type { Entry } from './journal';
import type { AlbumFolder } from './albums';
import type { JournalRepository } from './journal-repository';

async function read<T>(path:string,options?:RequestInit):Promise<T>{
 const response=await fetch(path,{...options,credentials:'same-origin',cache:'no-store'});
 const result=await response.json().catch(()=>({error:'Your cloud journal could not be reached. Please try again.'}));
 const message=result&&typeof result==='object'&&'error' in result&&typeof result.error==='string'?result.error:'Your cloud journal could not be reached. Please try again.';
 if(!response.ok)throw Error(response.status===401?'Your session expired. Sign in again to sync.':message);
 return result as T;
}
export const cloudJournal:JournalRepository & {listAlbums:()=>Promise<AlbumFolder[]>;saveAlbum:(folder:AlbumFolder)=>Promise<AlbumFolder>}={
 list:()=>read<Entry[]>('/api/entries'),
 async save(entry){
  const form=new FormData();
  form.set('entry',JSON.stringify({...entry,photos:entry.photos.map(photo=>({id:photo.id,caption:photo.caption}))}));
  for(const photo of entry.photos)if(photo.file)form.set(photo.id,photo.file);
  return read<Entry>('/api/entries',{method:'POST',body:form});
 },
 async remove(id){await read('/api/entries/'+encodeURIComponent(id),{method:'DELETE'})},
 listAlbums:()=>read<AlbumFolder[]>('/api/albums'),
 saveAlbum:folder=>read<AlbumFolder>('/api/albums',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(folder)}),
};
