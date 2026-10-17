import { env } from 'cloudflare:workers';
import { albumKeyFor } from './albums';
import { JOURNAL_OWNER_ID } from './journal-auth';
import type { Entry } from './journal';

export type SharedPhoto={id:string;caption:string;url:string};
export type SharedAlbum={token:string;place:string;country:string;photos:SharedPhoto[]};
type Share={token:string;owner:string;place:string;country:string;enabled:number};
export const defaultShare={token:'panchpokhari',owner:JOURNAL_OWNER_ID,place:'Panchpokhari',country:'',enabled:1};
export const sameSharedPlace=(share:Pick<Share,'place'|'country'>,entry:Pick<Entry,'location'|'country'>)=>albumKeyFor(share.place,share.country||entry.country)===albumKeyFor(entry.location,entry.country);
export async function findShare(token:string):Promise<Share|null>{
 if(!/^(panchpokhari|[0-9a-f-]{36})$/.test(token))return null;
 const row=await env.DB!.prepare('SELECT token,owner,place,country,enabled FROM album_shares WHERE token = ?').bind(token).first<Share>();
 if(row)return row.enabled?row:null;
 return token===defaultShare.token?defaultShare:null;
}
export async function sharedAlbum(token:string):Promise<SharedAlbum|null>{
 const share=await findShare(token);if(!share)return null;
 const rows=await env.DB!.prepare('SELECT data FROM entries WHERE owner = ? ORDER BY updated DESC').bind(share.owner).all<{data:string}>();
 const photos:SharedPhoto[]=[];
 for(const row of rows.results){const entry=JSON.parse(row.data) as Entry;if(sameSharedPlace(share,entry))for(const photo of entry.photos)photos.push({id:entry.id+'-'+photo.id,caption:photo.caption,url:`/api/shared/${encodeURIComponent(token)}/photos/${entry.id}/${photo.id}`})}
 return {token:share.token,place:share.place,country:share.country,photos};
}
