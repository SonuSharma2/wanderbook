import React from 'react';
import { createRoot } from 'react-dom/client';
import Journal from '../app/journal';
import PublicHomepage from '../app/public-homepage';
import { createBrowserJournal } from './browser-journal';
import { starterAlbums } from '../app/cloud-link';
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
 pagesRoot.render(<PublicHomepage/>);
}
