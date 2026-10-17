'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Camera, ChevronLeft, ChevronRight, Compass, MapPin, MoveHorizontal, Pause, Play, Plus } from 'lucide-react';
import { albumImage, type PlaceAlbum } from './albums';
import { useSweep } from './use-sweep';

const dateLabel=(date:string)=>new Date(date+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});

export default function TravelCover({albums,sample,memories,photos,places,onAdd,onOpen,onBrowse,onStories,onSwitch}:{
 albums:PlaceAlbum[];sample:boolean;memories:number;photos:number;places:number;
 onAdd:()=>void;onOpen:(album:PlaceAlbum)=>void;onBrowse:()=>void;onStories?:(key:string)=>void;onSwitch?:()=>void;
}){
 const choices=useMemo(()=>albums.filter(album=>album.photos.length).slice(0,4),[albums]);
 const [selected,setSelected]=useState(0),[playing,setPlaying]=useState(true),[reduced,setReduced]=useState(false),[hidden,setHidden]=useState(false);
 const root=useRef<HTMLElement>(null);
 useEffect(()=>setSelected(0),[albums,sample]);
 useEffect(()=>{
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');const preference=()=>setReduced(media.matches);preference();media.addEventListener('change',preference);
  const visibility=()=>setHidden(document.hidden);visibility();document.addEventListener('visibilitychange',visibility);
  let frame=0;
  const scroll=()=>{if(frame)return;frame=window.requestAnimationFrame(()=>{frame=0;root.current?.style.setProperty('--scene-scroll',`${Math.min(130,window.scrollY*.16)}px`)})};
  window.addEventListener('scroll',scroll,{passive:true});
  return()=>{media.removeEventListener('change',preference);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('scroll',scroll);window.cancelAnimationFrame(frame)};
 },[]);
 const active=choices[selected]||choices[0];
 const sweep=useSweep({enabled:choices.length>1,onStep:direction=>setSelected(previous=>(previous+direction+choices.length)%choices.length)});
 const upcoming=choices[(selected+sweep.direction+choices.length)%choices.length];
 const companion=active?.photos[1]||active?.photos[0];
 const moving=playing&&!reduced&&!hidden;

 return <section ref={root} className={'journal-home motion-cover '+(moving?'motion-running':'motion-paused')} aria-label="Your travel journal cover" onPointerMove={event=>{if(!moving||event.pointerType==='touch')return;const rect=event.currentTarget.getBoundingClientRect();root.current?.style.setProperty('--look-x',`${((event.clientX-rect.left)/rect.width-.5)*18}px`);root.current?.style.setProperty('--look-y',`${((event.clientY-rect.top)/rect.height-.5)*12}px`)}} onPointerLeave={()=>{root.current?.style.setProperty('--look-x','0px');root.current?.style.setProperty('--look-y','0px')}}>
  <div className="motion-hero">
   {active&&<div className="motion-scene" aria-hidden="true"><img key={active.key} className="motion-backdrop" src={albumImage(active.photos[0])} alt=""/><div className="motion-scene-shade"/></div>}
   <div className="motion-grain" aria-hidden="true"/>
   <div className="motion-content">
    <div className="motion-topline"><span><span className="motion-live-dot"/> A PERSONAL JOURNAL. AN OPEN WORLD.</span><div>{onSwitch&&<button onClick={onSwitch}>{sample?'Open my journal':'Explore the sample'}<ArrowUpRight size={14}/></button>}<button className="motion-toggle" aria-label={playing?'Pause cover animations':'Play cover animations'} aria-pressed={playing} onClick={()=>setPlaying(value=>!value)}>{playing?<Pause size={13}/>:<Play size={13}/>}</button></div></div>
    <div className="motion-main">
     <div className="motion-copy"><div className="motion-chapter"><span>WANDERBOOK</span><span>VOL. {String(new Date().getFullYear()).slice(-2)}</span></div><h1><span>Out there.</span><em>In here.</em></h1><p>The trails. The tables. The completely unplanned days. A living journal of everywhere you go.</p><div className="motion-actions"><button className="motion-add" onClick={onAdd}><Plus size={17}/>{active?'Add a memory':'Add your first memory'}<span><ArrowUpRight size={19}/></span></button>{active&&onStories&&<button className="motion-play" onClick={()=>onStories(active.key)}><span><Play size={13} fill="currentColor"/></span>Play your stories</button>}</div><div className="motion-footnote"><div className="motion-small-line"/><span>GO SOMEWHERE. FEEL SOMETHING. KEEP IT.</span></div></div>
     {active?<div className="motion-photo-desk">
      <svg className="motion-route" viewBox="0 0 600 520" fill="none" aria-hidden="true"><path d="M30 410C-20 240 450 510 490 300S80 45 160 110"/><circle cx="30" cy="410" r="5"/><circle cx="160" cy="110" r="5"/></svg>
      {upcoming&&choices.length>1&&<button className="motion-orbit-card orbit-next" onClick={()=>sweep.step(1)} aria-label={`Preview next place: ${upcoming.place}`}><img src={albumImage(upcoming.photos[0])} alt=""/><span>{upcoming.place}<ArrowUpRight size={13}/></span></button>}
      <div className="motion-front-float"><div className="cover-photo-frame">
       {upcoming&&<div className="cover-swipe-preview" aria-hidden="true"><img src={albumImage(upcoming.photos[0])} alt=""/><span>{upcoming.place}</span></div>}
       <div className={'cover-swipe-stage sweep-'+sweep.phase} {...sweep.props} tabIndex={choices.length>1?0:undefined} role="group" aria-label="Featured destination. Drag left or right, or use the arrow keys to change place." onKeyDown={event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();sweep.step(event.key==='ArrowRight'?1:-1)}}}>
        <div className="cover-swipe-card sweep-card" style={sweep.style}><img key={albumImage(active.photos[0])} className="cover-destination-photo" draggable={false} src={albumImage(active.photos[0])} alt={active.photos[0].photo.caption||active.place} fetchPriority="high"/><div className="cover-photo-shade"/><div className="cover-photo-topline"><span className="cover-collection-label">{sample?'SAMPLE COLLECTION':'YOUR COLLECTION'}</span><span className="cover-photo-index">{String(selected+1).padStart(2,'0')} / {String(choices.length).padStart(2,'0')}</span></div><div className="cover-place"><div><span className="cover-place-country"><MapPin size={12}/>{active.country}</span><h2>{active.place}</h2><span className="cover-photo-details"><Camera size={12}/>{active.photos.length} photos &middot; {active.memories.length} {active.memories.length===1?'memory':'memories'}</span></div><button className="cover-open-album" onClick={()=>onOpen(active)} aria-label={`Open featured album: ${active.place}`}><ArrowUpRight size={21}/></button></div></div>
       </div>
      </div><div className="motion-photo-label"><span>{dateLabel(active.latest)}</span><span><MoveHorizontal size={13}/> PULL TO EXPLORE</span></div></div>
      {companion&&<button className="motion-orbit-card orbit-moment" onClick={()=>onOpen(active)} aria-label={`Peek inside ${active.place}`}><img src={albumImage(companion)} alt=""/><span>A moment, kept.</span></button>}
      <div className="motion-seal" aria-hidden="true"><svg viewBox="0 0 100 100"><defs><path id="seal-letter-path" d="M50 50m-36 0a36 36 0 1 1 72 0a36 36 0 1 1-72 0"/></defs><text><textPath href="#seal-letter-path" textLength="226">GO. WANDER. COME BACK WITH STORIES. </textPath></text></svg><Compass size={31} strokeWidth={1.2}/></div>
      <div className="motion-location"><span className="motion-live-dot"/><span key={active.key}>{active.country||'SOMEWHERE NEW'}<small>{active.place}</small></span></div>
     </div>:<div className="home-first-memory motion-empty"><div className="home-empty-frame"><Camera size={42} strokeWidth={1}/><span>Your first photograph goes here</span><button className="motion-empty-add" onClick={onAdd}>Start your collection <ArrowUpRight size={17}/></button></div></div>}
    </div>
    <div className="motion-bottom"><div className="motion-stats"><div><strong>{String(memories).padStart(2,'0')}</strong><span>memories<br/>collected</span></div><div><strong>{String(places).padStart(2,'0')}</strong><span>places<br/>wandered</span></div><div><strong>{String(photos).padStart(2,'0')}</strong><span>moments<br/>in frames</span></div></div><button className="motion-scroll" onClick={onBrowse}><span>THERE'S MORE<br/>DOWN THE ROAD</span><span><ArrowDown size={19}/></span></button></div>
   </div>
  </div>
  {active&&<div className="motion-dock"><div className="motion-dock-title"><span>CHOOSE YOUR NEXT<br/><strong>little escape.</strong></span><MoveHorizontal size={18}/></div><div className="cover-destinations" aria-label="Choose a featured place">{choices.map((album,index)=><button key={album.key} className={'cover-destination '+(selected===index?'active':'')} aria-pressed={selected===index} aria-label={`Feature ${album.place}`} onClick={()=>{if(index!==selected)sweep.select(()=>setSelected(index),index>selected?1:-1)}}><img src={albumImage(album.photos[0])} alt=""/><span><small>{String(index+1).padStart(2,'0')} / {album.country}</small><strong>{album.place}</strong></span><ArrowUpRight size={15}/></button>)}</div><div className="motion-dock-arrows"><button aria-label="Previous featured place" onClick={()=>sweep.step(-1)}><ChevronLeft size={17}/></button><button aria-label="Next featured place" onClick={()=>sweep.step(1)}><ChevronRight size={17}/></button></div></div>}
  <div className="motion-ticker" aria-label="For trails, food discoveries, and everywhere in between"><div aria-hidden="true">{[0,1].map(i=><span className="motion-ticker-copy" key={i}><span>TAKE THE LONG WAY</span><Compass size={20}/><em>find your kind of somewhere</em><span className="ticker-star">*</span><span>KEEP THE LITTLE THINGS</span><Compass size={20}/><em>make room for a little wonder</em><span className="ticker-star">*</span></span>)}</div></div>
  {sample&&<div className="sample-disclosure"><span>Sample journal</span> Illustrative photos and stories. Your own memories are saved separately.</div>}
 </section>;
}
