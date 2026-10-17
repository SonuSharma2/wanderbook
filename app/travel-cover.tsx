'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, BookOpen, Camera, Compass, MapPin, Plus, Sparkles } from 'lucide-react';
import { albumImage, type PlaceAlbum } from './albums';

export default function TravelCover({albums,sample,memories,photos,places,onAdd,onOpen,onBrowse}:{
 albums:PlaceAlbum[];sample:boolean;memories:number;photos:number;places:number;
 onAdd:()=>void;onOpen:(album:PlaceAlbum)=>void;onBrowse:()=>void;
}){
 const choices=useMemo(()=>{
  const available=albums.filter(album=>album.photos.length);
  const first=(sample?available.find(album=>album.place==='Annapurna Base Camp'):undefined)||available[0];
  return first?[first,...available.filter(album=>album.key!==first.key)].slice(0,4):[];
 },[albums,sample]);
 const [selected,setSelected]=useState(0);
 useEffect(()=>setSelected(0),[albums,sample]);
 const active=choices[selected]||choices[0];
 const companion=active?.photos[1];
 const scene=active?albumImage(active.photos[0]):'/photos/trek.jpg';

 return <>
 <section className="travel-cover" aria-label="Your travel journal cover">
  <div className="cover-copy">
   <div className="cover-edition"><span/><span>YOUR LIFE, OFF THE BEATEN PATH</span><span className="cover-edition-number">№ 01</span></div>
   <h1>Some places<br/>stay <em>with you.</em></h1>
   <p>The winding trails. The little cafés. The days you wish you could bottle up. Give every adventure a place to live.</p>
   <div className="cover-buttons"><button className="cover-add" onClick={onAdd}><Plus size={17}/> Add your next memory <span><ArrowUpRight size={18}/></span></button><button className="cover-browse" onClick={onBrowse}>Explore the albums <ArrowDown size={15}/></button></div>
   <div className="cover-small-note"><div className="cover-mini-photos" aria-hidden="true"><img src="/photos/forest.jpg" alt=""/><img src="/photos/coffee.jpg" alt=""/><img src="/photos/lake.jpg" alt=""/></div><div><strong>Big adventures. Little discoveries.</strong><span>A beautiful home for both.</span></div></div>
   <div className="cover-bottom-note"><Compass size={17} strokeWidth={1.3}/><span>GO A LITTLE FURTHER. KEEP A LITTLE MORE.</span></div>
  </div>
  <div className="cover-visual">
   <div className="cover-photo-frame"><img key={scene} className="cover-destination-photo" src={scene} alt={active?`${active.place} — ${active.photos[0].photo.caption||'travel memories'}`:'Trekkers walking through a mountain landscape'} fetchPriority="high"/>
    <div className="cover-photo-shade"/>
    <div className="cover-photo-topline"><span className="cover-collection-label"><span/>{sample?'THE SAMPLE COLLECTION':'YOUR PERSONAL COLLECTION'}</span><span className="cover-photo-index">{String(selected+1).padStart(2,'0')} <span>/</span> {String(choices.length||1).padStart(2,'0')}</span></div>
    {companion&&<button className="cover-postcard" onClick={()=>active&&onOpen(active)} aria-label={`Peek inside ${active?.place}`}><img src={albumImage(companion)} alt=""/><span>One for the memory book.</span></button>}
    <div className="cover-place"><div><span className="cover-place-country"><MapPin size={13}/>{active?.country||'THE WORLD IS WAITING'}</span><h2>{active?.place||'Your next adventure'}</h2><span className="cover-photo-details"><Camera size={13}/>{active?`${active.photos.length} photographs · ${active.memories.length} ${active.memories.length===1?'memory':'memories'}`:'A new story starts with a single moment.'}</span></div><button className="cover-open-album" onClick={()=>active?onOpen(active):onAdd()} aria-label={active?`Open featured album: ${active.place}`:'Add your first memory'}><ArrowUpRight size={23}/></button></div>
   </div>
   {choices.length>1?<div className="cover-destinations" aria-label="Choose a featured place">{choices.map((album,index)=><button key={album.key} className={index===selected?'cover-destination active':'cover-destination'} onClick={()=>setSelected(index)} aria-pressed={index===selected} aria-label={`Feature ${album.place}`}><img src={albumImage(album.photos[0])} alt=""/><span><small>{String(index+1).padStart(2,'0')}</small><strong>{album.place}</strong></span><ArrowUpRight size={13}/></button>)}</div>:<div className="cover-visual-caption"><Camera size={14}/><span>Photographs become stories. Stories become you.</span><Sparkles size={14}/></div>}
  </div>
 </section>
 <section className="journal-summary" aria-label={sample?'Sample journal statistics':'Your journal statistics'}><div className="summary-title"><span className="summary-star">✳</span><span>Your story,<br/><em>so far.</em></span></div><div className="summary-stat"><BookOpen size={19} strokeWidth={1.3}/><strong>{String(memories).padStart(2,'0')}</strong><span>memories<br/>worth keeping</span></div><div className="summary-stat"><MapPin size={19} strokeWidth={1.3}/><strong>{String(places).padStart(2,'0')}</strong><span>places<br/>that left a mark</span></div><div className="summary-stat"><Camera size={19} strokeWidth={1.3}/><strong>{String(photos).padStart(2,'0')}</strong><span>photographs<br/>to take you back</span></div><button className="summary-invitation" onClick={onAdd}><span>And so much<br/>more to come.</span><ArrowRight size={20}/></button></section>
 </>;
}
