'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, Camera, ChevronLeft, ChevronRight, Compass, MapPin, MoveHorizontal, Pause, Play, Plus } from 'lucide-react';
import { albumImage, type PlaceAlbum } from './albums';
import { useSweep } from './use-sweep';

export default function TravelCover({albums,sample,onAdd,onOpen,onBrowse,onSwitch}:{
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
    <div className="motion-topline"><span>{sample?'Sample photos':''}</span><div>{onSwitch&&<button onClick={onSwitch}>{sample?'My journal':'Sample'}<ArrowUpRight size={14}/></button>}<button className="motion-toggle" aria-label={playing?'Pause cover animations':'Play cover animations'} aria-pressed={playing} onClick={()=>setPlaying(value=>!value)}>{playing?<Pause size={13}/>:<Play size={13}/>}</button></div></div>
    <div className="motion-main">
     <div className="motion-copy"><h1><span>Places worth</span><em>keeping.</em></h1><div className="motion-actions"><button className="motion-add" onClick={onAdd}><Plus size={17}/>Add a memory<span><ArrowUpRight size={19}/></span></button></div></div>
     {active?<div className="motion-photo-desk">
      <svg className="motion-route" viewBox="0 0 600 520" fill="none" aria-hidden="true"><path d="M30 410C-20 240 450 510 490 300S80 45 160 110"/><circle cx="30" cy="410" r="5"/><circle cx="160" cy="110" r="5"/></svg>
      {upcoming&&choices.length>1&&<button className="motion-orbit-card orbit-next" onClick={()=>sweep.step(1)} aria-label={`Preview next place: ${upcoming.place}`}><img src={albumImage(upcoming.photos[0])} alt=""/><span>{upcoming.place}<ArrowUpRight size={13}/></span></button>}
      <div className="motion-front-float"><div className="cover-photo-frame">
       {upcoming&&<div className="cover-swipe-preview" aria-hidden="true"><img src={albumImage(upcoming.photos[0])} alt=""/><span>{upcoming.place}</span></div>}
       <div className={'cover-swipe-stage sweep-'+sweep.phase} {...sweep.props} tabIndex={choices.length>1?0:undefined} role="group" aria-label="Featured destination. Drag left or right, or use the arrow keys to change place." onKeyDown={event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();sweep.step(event.key==='ArrowRight'?1:-1)}}}>
        <div className="cover-swipe-card sweep-card" style={sweep.style}><img key={albumImage(active.photos[0])} className="cover-destination-photo" draggable={false} src={albumImage(active.photos[0])} alt={active.photos[0].photo.caption||active.place} fetchPriority="high"/><div className="cover-photo-shade"/><div className="cover-photo-topline"><span className="cover-photo-index">{String(selected+1).padStart(2,'0')} / {String(choices.length).padStart(2,'0')}</span></div><div className="cover-place"><div><span className="cover-place-country"><MapPin size={12}/>{active.country}</span><h2>{active.place}</h2><span className="cover-photo-details"><Camera size={12}/>{active.photos.length} photos</span></div><button className="cover-open-album" onClick={()=>onOpen(active)} aria-label={`Open featured album: ${active.place}`}><ArrowUpRight size={21}/></button></div></div>
       </div>
      </div><div className="motion-photo-label" aria-hidden="true"><MoveHorizontal size={16}/></div></div>
      {companion&&<button className="motion-orbit-card orbit-moment" onClick={()=>onOpen(active)} aria-label={`Peek inside ${active.place}`}><img src={albumImage(companion)} alt=""/></button>}
      <div className="motion-seal" aria-hidden="true"><svg viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth=".6" strokeDasharray="2 8"/><circle cx="50" cy="50" r="33" stroke="currentColor" strokeWidth=".4"/></svg><Compass size={31} strokeWidth={1.2}/></div>

     </div>:<div className="home-first-memory motion-empty"><div className="home-empty-frame"><Camera size={42} strokeWidth={1}/><button className="motion-empty-add" onClick={onAdd}>Add photos <ArrowUpRight size={17}/></button></div></div>}
    </div>
    <div className="motion-bottom"><button className="motion-scroll" onClick={onBrowse} aria-label="Browse albums" title="Browse albums"><span><ArrowDown size={19}/></span></button></div>
   </div>
  </div>
  {active&&<div className="motion-dock"><div className="cover-destinations" aria-label="Choose a featured place">{choices.map((album,index)=><button key={album.key} className={'cover-destination '+(selected===index?'active':'')} aria-pressed={selected===index} aria-label={`Feature ${album.place}`} onClick={()=>{if(index!==selected)sweep.select(()=>setSelected(index),index>selected?1:-1)}}><img src={albumImage(album.photos[0])} alt=""/><span><strong>{album.place}</strong></span><ArrowUpRight size={15}/></button>)}</div><div className="motion-dock-arrows"><button aria-label="Previous featured place" onClick={()=>sweep.step(-1)}><ChevronLeft size={17}/></button><button aria-label="Next featured place" onClick={()=>sweep.step(1)}><ChevronRight size={17}/></button></div></div>}


 </section>;
}
