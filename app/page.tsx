import Journal from './journal';
import { getJournalUser } from './journal-auth';
import { redirect } from 'next/navigation';
import { starterAlbums } from './cloud-link';
export const dynamic = 'force-dynamic';
export default async function Home({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
 const user = await getJournalUser();
 if(!user){const query=await searchParams;if(query.restore==='1')redirect('/signin-with-chatgpt?return_to='+encodeURIComponent('/?restore=1'));redirect('/album/panchpokhari')}
 return <Journal signedIn={!!user} name={user?.displayName || 'Fellow wanderer'} starterAlbums={starterAlbums}/>;
}
