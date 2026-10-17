import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../../../chatgpt-auth';
export async function GET(request:Request,{params}:{params:Promise<{entry:string,id:string}>}){
 const u=await getChatGPTUser();if(!u)return new Response('Unauthorized',{status:401});
 const p=await params;if(!/^[\w-]+$/.test(p.entry)||!/^[\w-]+$/.test(p.id))return new Response('Not found',{status:404});
 const o=await env.BUCKET!.get(`${u.userId}/${p.entry}/${p.id}`);if(!o)return new Response('Not found',{status:404});
 return new Response(o.body,{headers:{'Content-Type':o.httpMetadata?.contentType||'image/jpeg','Cache-Control':'private, max-age=3600','X-Content-Type-Options':'nosniff'}});
}
