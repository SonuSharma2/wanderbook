import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
import { z } from 'zod';
const photo=z.object({id:z.string().uuid(),caption:z.string().max(300).default('')});
const entry=z.object({id:z.string().uuid(),title:z.string().trim().min(1).max(120),location:z.string().trim().min(1).max(150),country:z.string().trim().max(80),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),category:z.enum(['Trekking','Roaming','Food & cafés']),mood:z.enum(['Adventure','Peaceful','With friends','Solo','Food hunt']),story:z.string().max(20000),trip:z.string().max(120),rating:z.number().int().min(0).max(5),cost:z.string().max(60),favorite:z.boolean(),lat:z.number().min(-90).max(90).nullable(),lng:z.number().min(-180).max(180).nullable(),photos:z.array(photo).max(24)});
export async function GET(){
 const u=await getChatGPTUser();if(!u)return Response.json({error:'Please sign in to open your journal.'},{status:401});
 const rows=await env.DB!.prepare('SELECT data FROM entries WHERE owner = ? ORDER BY updated DESC').bind(u.userId).all<{data:string}>();
 return Response.json(rows.results.map(r=>JSON.parse(r.data)),{headers:{'Cache-Control':'private, no-store'}});
}
export async function POST(request:Request){
 const u=await getChatGPTUser();if(!u)return Response.json({error:'Please sign in to save memories.'},{status:401});
 if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return new Response('Forbidden',{status:403});
 if(Number(request.headers.get('content-length')||0)>45*1024*1024)return Response.json({error:'Please upload fewer photos at once.'},{status:413});
 let form:FormData;try{form=await request.formData()}catch{return Response.json({error:'Invalid upload.'},{status:400})}
 let parsed;try{parsed=entry.safeParse(JSON.parse(String(form.get('entry'))))}catch{return Response.json({error:'Invalid memory.'},{status:400})}
 if(!parsed.success)return Response.json({error:parsed.error.issues[0]?.message||'Check your memory details.'},{status:400});
 const data=parsed.data;
 const previous=await env.DB!.prepare('SELECT data FROM entries WHERE id = ?').bind(data.id).first<{data:string}>();
 if(previous){const owned=await env.DB!.prepare('SELECT id FROM entries WHERE id = ? AND owner = ?').bind(data.id,u.userId).first();if(!owned)return new Response('Forbidden',{status:403})}
 const oldPhotos:{id:string}[]=previous?JSON.parse(previous.data).photos:[];
 const uploaded:{id:string,file:File}[]=[];
 for(const p of data.photos){const f=form.get(p.id);if(f instanceof File){
 if(!['image/jpeg','image/png','image/webp','image/avif'].includes(f.type)||f.size>8*1024*1024||!f.size)return Response.json({error:'Use JPG, PNG, WebP, or AVIF photos up to 8 MB each.'},{status:400});
 uploaded.push({id:p.id,file:f});
 }else if(!oldPhotos.some(old=>old.id===p.id))return Response.json({error:'A photo is missing. Please attach it again.'},{status:400})}
 const key=(id:string)=>`${u.userId}/${data.id}/${id}`;
 try{for(const p of uploaded)await env.BUCKET!.put(key(p.id),p.file.stream(),{httpMetadata:{contentType:p.file.type}});
 await env.DB!.prepare('INSERT INTO entries (id,owner,data,updated) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,updated=excluded.updated WHERE entries.owner=excluded.owner').bind(data.id,u.userId,JSON.stringify(data),new Date().toISOString()).run();
 }catch{for(const p of uploaded)if(!oldPhotos.some(old=>old.id===p.id))await env.BUCKET!.delete(key(p.id));return Response.json({error:'Could not save this memory. Please try again.'},{status:500})}
 for(const p of oldPhotos)if(!data.photos.some(keep=>keep.id===p.id))await env.BUCKET!.delete(key(p.id));
 return Response.json(data);
}
