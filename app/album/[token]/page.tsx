import { notFound } from 'next/navigation';
import { sharedAlbum } from '../../shared-albums';
import PublicAlbum from '../../public-album';
export const dynamic='force-dynamic';
export const metadata={title:'Wanderbook — a shared photo album',robots:{index:false,follow:false},referrer:'no-referrer'};
export default async function AlbumPage({params}:{params:Promise<{token:string}>}){
 const album=await sharedAlbum((await params).token);
 if(!album)notFound();
 return <PublicAlbum initial={album}/>;
}
