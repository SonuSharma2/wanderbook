export const CLOUD_JOURNAL_URL='https://wanderbook-travel-stories.copperbowl.chatgpt.site';
export const PUBLIC_ALBUM_URL=CLOUD_JOURNAL_URL+'/album/panchpokhari';
export function syncedJournalUrl(search=''){
 const query=new URLSearchParams(search),url=new URL(CLOUD_JOURNAL_URL);
 if(query.get('restore')!=='1')return PUBLIC_ALBUM_URL;
 for(const key of ['album','restore']){const value=query.get(key);if(value)url.searchParams.set(key,value)}
 return url.href;
}
export const starterAlbums=[{place:'Panchpokhari',country:''}];
