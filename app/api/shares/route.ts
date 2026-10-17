import { env } from 'cloudflare:workers';
import { z } from 'zod';
import { getJournalUser } from '../../journal-auth';
import { albumKeyFor } from '../../albums';
import { defaultShare, sameSharedPlace } from '../../shared-albums';
const folder=z.object({place:z.string().trim().min(1).max(150),country:z.string().trim().max(80)});
async function change(request:Request,enabled:number){
 const user=await getJournalUser();if(!user)return Response.json({error:'Only the journal owner can change sharing.'},{status:401});
 if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return new Response('Forbidden',{status:403});
 if(Number(request.headers.get('content-length')||0)>4096)return new Response('Too large',{status:413});
 let parsed;try{parsed=folder.safeParse(await request.json())}catch{return Response.json({error:'Invalid album.'},{status:400})}
 if(!parsed.success)return Response.json({error:'Choose a valid album.'},{status:400});
 const data=parsed.data,isDefault=sameSharedPlace(defaultShare,{location:data.place,country:data.country});
 const key=isDefault?albumKeyFor(defaultShare.place,''):albumKeyFor(data.place,data.country);
 const existing=await env.DB!.prepare('SELECT token FROM album_shares WHERE owner = ? AND key = ?').bind(user.userId,key).first<{token:string}>();
 const token=existing?.token||(isDefault?defaultShare.token:crypto.randomUUID());
 await env.DB!.prepare('INSERT INTO album_shares (token,owner,key,place,country,enabled,created) VALUES (?,?,?,?,?,?,?) ON CONFLICT(owner,key) DO UPDATE SET enabled=excluded.enabled').bind(token,user.userId,key,isDefault?defaultShare.place:data.place,isDefault?'':data.country,enabled,new Date().toISOString()).run();
 const saved=await env.DB!.prepare('SELECT token,enabled FROM album_shares WHERE owner = ? AND key = ?').bind(user.userId,key).first<{token:string;enabled:number}>();
 return Response.json({url:new URL('/album/'+saved!.token,request.url).href,enabled:!!saved!.enabled},{headers:{'Cache-Control':'private, no-store'}});
}
export const POST=(request:Request)=>change(request,1);
export const DELETE=(request:Request)=>change(request,0);
