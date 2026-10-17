import Journal from './journal';
import { getChatGPTUser } from './chatgpt-auth';
import { starterAlbums } from './cloud-link';
export const dynamic = 'force-dynamic';
export default async function Home() {
 const user = await getChatGPTUser();
 return <Journal signedIn={!!user} name={user?.displayName || 'Fellow wanderer'} starterAlbums={starterAlbums}/>;
}
