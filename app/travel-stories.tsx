'use client';
import { useEffect,useMemo,useRef,useState } from 'react';
import { ArrowRight,ArrowUpRight,BookOpen,ChevronLeft,ChevronRight,ImageOff,MapPin,Pause,Play,Plus,Sparkles,X } from 'lucide-react';
import { albumImage,type PlaceAlbum } from './albums';
import Modal from './modal';
import { useSweep } from './use-sweep';

export const storyStamp=(album:PlaceAlbum)=>`${album.latest}:${album.photos.map(p=>p.photo.id).join(',')}`;
export function StoriesShelf({albums,seen,onOpen,onAdd,sample,readOnly=false}:{albums:PlaceAlbum[];seen:Record<string,string>;onOpen:(key:string)=>void;onAdd:()=>void;sample:boolean;readOnly?:boolean}){
 const available=albums.filter(album=>album.photos.length);
 return <section className="stories-shelf" aria-label="Travel stories"><div className="stories-shelf-heading"><div><h2>Stories</h2></div></div><div className="story-circles">{!readOnly&&<button className="story-circle add-story" onClick={onAdd}><span className="story-ring"><span><Plus size={23} strokeWidth={1.4}/></span></span><strong>Add a story</strong></button>}{available.map(album=><button className={'story-circle '+(seen[album.key]===storyStamp(album)?'seen':'')} key={album.key} onClick={()=>onOpen(album.key)} aria-label={`Watch stories: ${album.place}`}><span className="story-ring"><span><img src={albumImage(album.photos[0])} alt=""/><span className="story-play"><Play size={12} fill="currentColor"/></span></span></span><strong>{album.place}</strong></button>)}{!available.length&&<p className="stories-empty">{readOnly?'Shared photo stories will appear here.':<>Add a few photos to your next memory.<br/>Your place stories will appear here.</>}</p>}</div></section>;
}

export function StoryViewer({albums,startKey,onClose,onAlbum,onSeen,readOnly=false}:{albums:PlaceAlbum[];startKey:string;onClose:()=>void;onAlbum:(album:PlaceAlbum)=>void;onSeen:(album:PlaceAlbum)=>void;readOnly?:boolean}){
 const places=useMemo(()=>albums.filter(album=>album.photos.length),[albums]);
 const [place,setPlace]=useState(()=>Math.max(0,places.findIndex(album=>album.key===startKey))),[photo,setPhoto]=useState(0),[elapsed,setElapsed]=useState(0),[manualPause,setManualPause]=useState(false),[holding,setHolding]=useState(false),[hidden,setHidden]=useState(false),[ready,setReady]=useState(false),[failed,setFailed]=useState(false);
 const album=places[Math.min(place,places.length-1)],frame=album?.photos[Math.min(photo,(album?.photos.length||1)-1)];
 const imageRef=useRef<HTMLImageElement>(null);
 const duration=5500;
 const move=(direction:number)=>{
  if(!album)return;
  if(direction>0&&photo<album.photos.length-1)setPhoto(photo+1);
  else if(direction>0){onSeen(album);if(place<places.length-1){setPlace(place+1);setPhoto(0)}else onClose()}
  else if(photo>0)setPhoto(photo-1);
  else if(place>0){setPlace(place-1);setPhoto(places[place-1].photos.length-1)}else setElapsed(0);
 };
 const movePlace=(direction:number)=>{const next=place+direction;if(next<0){setPhoto(0);setElapsed(0)}else if(next>=places.length)onClose();else{setPlace(next);setPhoto(0)}};
 const sweep=useSweep({onStep:movePlace,onTap:(x,width)=>move(x<width*.35?-1:1),onHold:setHolding,onDismiss:onClose});
 const paused=manualPause||holding||hidden||sweep.busy||!ready;
 useEffect(()=>{const preference=window.matchMedia('(prefers-reduced-motion: reduce)');if(preference.matches)setManualPause(true);const visibility=()=>setHidden(document.hidden);visibility();document.addEventListener('visibilitychange',visibility);return()=>document.removeEventListener('visibilitychange',visibility)},[]);
 useEffect(()=>{setElapsed(0);setReady(false);setFailed(false);if(imageRef.current?.complete&&imageRef.current.naturalWidth>0)setReady(true)},[album?.key,photo]);
 useEffect(()=>{if(paused||!album)return;const timer=window.setInterval(()=>setElapsed(previous=>Math.min(duration,previous+50)),50);return()=>clearInterval(timer)},[paused,album?.key,photo]);
 useEffect(()=>{if(elapsed>=duration)move(1)},[elapsed]);
 if(!album||!frame)return null;
 const previous=places[place-1],next=places[place+1];
 return <Modal label="Travel stories viewer" className="story-viewer" onClose={onClose}>
  <div className="story-experience" onKeyDown={event=>{if(event.key==='ArrowRight'){event.preventDefault();move(1)}if(event.key==='ArrowLeft'){event.preventDefault();move(-1)}if(event.key===' '&&!(event.target as Element).closest('button')){event.preventDefault();setManualPause(value=>!value)}}}>
   <div className="story-brand"><Sparkles size={17}/><span>wanderbook <em>stories</em></span><small>{readOnly?'PHOTO STORIES':'PRIVATE PHOTO STORIES'}</small></div>
   {previous&&<button className="story-neighbor previous" onClick={()=>movePlace(-1)} aria-label={`Previous place stories: ${previous.place}`}><img src={albumImage(previous.photos[0])} alt=""/><span>{previous.place}</span><ChevronLeft size={25}/></button>}
   <div className={'story-stage sweep-'+sweep.phase} {...sweep.props}>
    <div className="story-slide sweep-card" style={sweep.style}>
     <div className="story-image-backdrop" aria-hidden="true" style={{backgroundImage:`url("${albumImage(frame)}")`}}/>
     <img key={`${frame.entry.id}-${frame.photo.id}`} ref={imageRef} className="story-photo" src={albumImage(frame)} alt={frame.photo.caption||frame.entry.title} draggable={false} onLoad={()=>setReady(true)} onError={()=>{setFailed(true);setReady(false)}}/>
     <div className="story-shade"/>
     {failed&&<div className="story-load-error"><ImageOff size={30}/><p>This photo could not load.</p><button onClick={()=>move(1)}>Skip photo <ArrowRight size={15}/></button></div>}
     <div className="story-progress" aria-label={`Photo ${photo+1} of ${album.photos.length}`}>{album.photos.map((item,index)=><button key={`${item.entry.id}-${item.photo.id}`} aria-label={`Go to story photo ${index+1}`} onClick={()=>{setPhoto(index);setElapsed(0)}}><span style={{width:index<photo?'100%':index===photo?`${elapsed/duration*100}%`:'0%'}}/></button>)}</div>
     <div className="story-top"><div className="story-place-avatar"><img src={albumImage(album.photos[0])} alt=""/></div><div className="story-place-info"><strong>{album.place}</strong><span>{frame.entry.date?new Date(frame.entry.date+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'Shared album'}</span></div><div className="story-controls"><button onClick={()=>move(-1)} aria-label="Previous story photo"><ChevronLeft size={16}/></button><button onClick={()=>move(1)} aria-label="Next story photo"><ChevronRight size={16}/></button><button onClick={()=>setManualPause(!manualPause)} aria-label={manualPause?'Play stories':'Pause stories'}>{manualPause?<Play size={17}/>:<Pause size={17}/>}</button><button onClick={onClose} aria-label="Close stories"><X size={21}/></button></div></div>
     {holding&&<span className="story-held">Paused while you hold</span>}
     <div className="story-caption"><span className="story-location"><MapPin size={12}/>{album.country||'Somewhere worth keeping'}</span><h2>{frame.entry.title}</h2>{frame.photo.caption&&<p>{frame.photo.caption}</p>}<button className="story-open-album" onClick={()=>onAlbum(album)}><BookOpen size={15}/> Open the album <ArrowUpRight size={17}/></button></div>
    </div>
   </div>
   {next&&<button className="story-neighbor next" onClick={()=>movePlace(1)} aria-label={`Next place stories: ${next.place}`}><img src={albumImage(next.photos[0])} alt=""/><span>{next.place}</span><ChevronRight size={25}/></button>}
   <p className="story-instructions">Tap to move on <span>·</span> Hold to stay a little longer <span>·</span> Swipe to another place</p>
  </div>
 </Modal>;
}
