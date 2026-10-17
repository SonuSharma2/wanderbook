import React from 'react';
import { createRoot } from 'react-dom/client';
import Journal from '../app/journal';
import { createBrowserJournal } from './browser-journal';
import { starterAlbums, syncedJournalUrl } from '../app/cloud-link';
import '../app/globals.css';
import '../app/gestures-stories.css';
import '../app/travel-cover.css';
import '../app/motion-home.css';

const repository=createBrowserJournal();
async function start(){
 const root=document.getElementById('root')!;
 if(new URLSearchParams(window.location.search).get('device')!=='1'){
  try{
   const entries=await repository.list(),folders=JSON.parse(localStorage.getItem('wanderbook-albums')||'[]');
   if(!entries.length&&(!Array.isArray(folders)||!folders.length)){window.location.replace(syncedJournalUrl(window.location.search));return}
  }catch{}
 }
 createRoot(root).render(<Journal signedIn name="Traveler" repository={repository} starterAlbums={starterAlbums}/>);
}
void start();
