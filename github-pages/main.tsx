import React from 'react';
import { createRoot } from 'react-dom/client';
import Journal from '../app/journal';
import { createBrowserJournal } from './browser-journal';
import '../app/globals.css';
import '../app/gestures-stories.css';
import '../app/travel-cover.css';
import '../app/motion-home.css';

const repository=createBrowserJournal();
createRoot(document.getElementById('root')!).render(<Journal signedIn name="Traveler" repository={repository}/>);
