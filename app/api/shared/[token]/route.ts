import { sharedAlbum } from '../../../shared-albums';
export async function GET(_request:Request,{params}:{params:Promise<{token:string}>}){
 const album=await sharedAlbum((await params).token);
 return Response.json(album||{error:'This album link is unavailable.'},{status:album?200:404,headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer'}});
}
