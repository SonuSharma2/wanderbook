import { env } from 'cloudflare:workers';
import { getJournalUser } from '../../../journal-auth';
export async function DELETE(request:Request,{params}:{params:Promise<{id:string}>}){
 const u=await getJournalUser();if(!u)return new Response('Unauthorized',{status:401});
 if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return new Response('Forbidden',{status:403});
 const {id}=await params;const row=await env.DB!.prepare('SELECT data FROM entries WHERE id = ? AND owner = ?').bind(id,u.userId).first<{data:string}>();
 if(!row)return new Response('Not found',{status:404});
 for(const p of JSON.parse(row.data).photos)await env.BUCKET!.delete(`${u.userId}/${id}/${p.id}`);
 await env.DB!.prepare('DELETE FROM entries WHERE id = ? AND owner = ?').bind(id,u.userId).run();return Response.json({ok:true});
}
