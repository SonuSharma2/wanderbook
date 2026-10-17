import { env } from 'cloudflare:workers';
import { z } from 'zod';
import { getJournalUser } from '../../journal-auth';
import { albumKeyFor } from '../../albums';

const folder=z.object({place:z.string().trim().min(1).max(150),country:z.string().trim().max(80)});
export async function GET(){
 const user=await getJournalUser();
 if(!user)return Response.json({error:'Sign in to open your albums.'},{status:401});
 const rows=await env.DB!.prepare('SELECT place,country FROM album_folders WHERE owner = ? ORDER BY created,key').bind(user.userId).all<{place:string;country:string}>();
 return Response.json(rows.results,{headers:{'Cache-Control':'private, no-store'}});
}
export async function POST(request:Request){
 const user=await getJournalUser();
 if(!user)return Response.json({error:'Sign in to save an album.'},{status:401});
 if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return new Response('Forbidden',{status:403});
 if(Number(request.headers.get('content-length')||0)>4096)return Response.json({error:'Album details are too long.'},{status:413});
 let parsed;try{parsed=folder.safeParse(await request.json())}catch{return Response.json({error:'Invalid album.'},{status:400})}
 if(!parsed.success)return Response.json({error:'Choose a valid album name and country.'},{status:400});
 const data=parsed.data,key=albumKeyFor(data.place,data.country);
 const existing=await env.DB!.prepare('SELECT key FROM album_folders WHERE owner = ? AND key = ?').bind(user.userId,key).first();
 if(!existing){
  const total=await env.DB!.prepare('SELECT COUNT(*) AS count FROM album_folders WHERE owner = ?').bind(user.userId).first<{count:number}>();
  if((total?.count||0)>=500)return Response.json({error:'You can keep up to 500 albums.'},{status:400});
 }
 await env.DB!.prepare('INSERT INTO album_folders (owner,key,place,country,created) VALUES (?,?,?,?,?) ON CONFLICT(owner,key) DO UPDATE SET place=excluded.place,country=excluded.country').bind(user.userId,key,data.place,data.country,new Date().toISOString()).run();
 return Response.json(data,{headers:{'Cache-Control':'private, no-store'}});
}
