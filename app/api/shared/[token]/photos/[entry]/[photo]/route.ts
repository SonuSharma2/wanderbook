import { env } from 'cloudflare:workers';
import { findShare, sameSharedPlace } from '../../../../../../shared-albums';
import type { Entry } from '../../../../../../journal';
export async function GET(_request:Request,{params}:{params:Promise<{token:string;entry:string;photo:string}>}){
 const values=await params,share=await findShare(values.token);
 if(!share||!/^[-a-f0-9]{36}$/.test(values.entry)||!/^[-a-f0-9]{36}$/.test(values.photo))return new Response('Not found',{status:404});
 const row=await env.DB!.prepare('SELECT data FROM entries WHERE id = ? AND owner = ?').bind(values.entry,share.owner).first<{data:string}>();
 const entry=row?JSON.parse(row.data) as Entry:null;
 if(!entry||!sameSharedPlace(share,entry)||!entry.photos.some(photo=>photo.id===values.photo))return new Response('Not found',{status:404});
 const object=await env.BUCKET!.get(`${share.owner}/${entry.id}/${values.photo}`);
 if(!object)return new Response('Not found',{status:404});
 return new Response(object.body,{headers:{'Content-Type':object.httpMetadata?.contentType||'image/jpeg','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer'}});
}
