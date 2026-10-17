import Journal from './journal';
import { getChatGPTUser } from './chatgpt-auth';
export const dynamic = 'force-dynamic';
export default async function Home() {
 const user = await getChatGPTUser();
 return <Journal signedIn={!!user} name={user?.fullName || 'Fellow wanderer'} />;
}
