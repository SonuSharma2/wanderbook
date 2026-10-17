import React from 'react';
import { createRoot } from 'react-dom/client';
import Journal from '../app/journal';
import PublicAlbum from '../app/public-album';
import { createBrowserJournal } from './browser-journal';
import { starterAlbums, CLOUD_JOURNAL_URL } from '../app/cloud-link';
import '../app/globals.css';
import '../app/gestures-stories.css';
import '../app/travel-cover.css';
import '../app/motion-home.css';
import '../app/public-album.css';

export const pagesRoot=createRoot(document.getElementById('root')!);
if(new URLSearchParams(window.location.search).get('device')==='1'){
 const repository=createBrowserJournal();
 pagesRoot.render(<Journal signedIn name="Traveler" repository={repository} starterAlbums={starterAlbums}/>);
}else{
 pagesRoot.render(<PublicAlbum initial={{token:'panchpokhari',place:'Panchpokhari',country:'',photos:[]}} apiOrigin={CLOUD_JOURNAL_URL} homeHref={import.meta.env.BASE_URL} manageHref={CLOUD_JOURNAL_URL+'/signin-with-chatgpt?return_to=/'} loadOnMount/>);
}
