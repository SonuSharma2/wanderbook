'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Camera, ChevronLeft, ChevronRight, Compass, ImagePlus, MapPin, Pause, Play, Plus, X } from 'lucide-react';
import { albumImage, type AlbumPhoto, type PlaceAlbum } from './albums';
import type { Entry } from './journal';

export function PlaceAlbums({ albums, sample, loading, onOpen, onAdd }: {
  albums: PlaceAlbum[]; sample: boolean; loading: boolean; onOpen: (album: PlaceAlbum) => void; onAdd: () => void;
}) {
  const rail = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [touching, setTouching] = useState(false);
  const interacting = hovered || focused || touching;
  const [reducedMotion, setReducedMotion] = useState(false);
  const [coverTick, setCoverTick] = useState(0);
  const [active, setActive] = useState(0);
  const [overflow, setOverflow] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const changed = () => setReducedMotion(preference.matches);
    changed(); preference.addEventListener('change', changed);
    const visibility = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', visibility);
    return () => { preference.removeEventListener('change', changed); document.removeEventListener('visibilitychange', visibility); };
  }, []);

  useEffect(() => {
    const element = rail.current;
    if (!element) return;
    const measure = () => setOverflow(element.scrollWidth > element.clientWidth + 2);
    const observer = new ResizeObserver(measure);
    observer.observe(element); measure(); element.scrollLeft = 0; setActive(0); setCoverTick(0);
    return () => observer.disconnect();
  }, [albums]);

  const go = (direction: number) => {
    const element = rail.current;
    if (!element || !element.children.length) return;
    const step = (element.children[0] as HTMLElement).offsetWidth + 26;
    const end = element.scrollWidth - element.clientWidth;
    const target = direction > 0 && element.scrollLeft >= end - 5 ? 0
      : direction < 0 && element.scrollLeft <= 5 ? end
      : Math.max(0, Math.min(end, element.scrollLeft + direction * step));
    element.scrollTo({ left: target, behavior: reducedMotion ? 'instant' : 'smooth' });
  };

  useEffect(() => {
    if (!playing || interacting || reducedMotion || hidden || !albums.length) return;
    const timer = window.setInterval(() => { setCoverTick(t => t + 1); if (overflow) go(1); }, 5200);
    return () => clearInterval(timer);
  }, [playing, interacting, reducedMotion, hidden, albums.length, overflow]);

  const animate = playing && !interacting && !reducedMotion && !hidden;
  return <section id="place-albums" className={'place-albums ' + (animate ? 'albums-moving' : 'albums-still')} aria-label="Photo albums by place">
    <div className="albums-heading"><div><h2>Place albums</h2><p>{sample ? 'Six places to explore in the sample journal.' : 'Every visit to the same place, collected in one album.'}</p></div><div className="album-controls">
      <button className="album-motion" type="button" onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pause album animations' : 'Play album animations'} aria-pressed={playing}>{playing ? <Pause size={14}/> : <Play size={14}/>}<span>{playing ? 'Pause slideshow' : 'Play slideshow'}</span></button>
      {overflow && <><button type="button" className="album-arrow" onClick={() => go(-1)} aria-label="Previous place albums"><ChevronLeft size={18}/></button><button type="button" className="album-arrow" onClick={() => go(1)} aria-label="Next place albums"><ChevronRight size={18}/></button></>}
    </div></div>
    {albums.length ? <>
      <div className="album-rail" ref={rail} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }} onPointerDown={event => { if (event.pointerType !== 'mouse') setTouching(true); }} onPointerUp={() => setTouching(false)} onPointerCancel={() => setTouching(false)} onScroll={() => { const element = rail.current; if (element?.children[0]) setActive(Math.round(element.scrollLeft / ((element.children[0] as HTMLElement).offsetWidth + 26))); }}>
        {albums.map((album, index) => <button key={album.key} type="button" className="place-album" style={{ '--album-delay': `${index * -.9}s`, '--album-tilt': `${[-3, 2, -1, 3][index % 4]}deg` } as React.CSSProperties} onClick={() => onOpen(album)} aria-label={`Open album: ${album.place}${album.country ? `, ${album.country}` : ''}, ${album.photos.length} photos`}>
          <div className="album-front"><div className="album-cover">
            {album.photos.length ? album.photos.slice(0, 3).map((photo, i) => <img key={`${photo.entry.id}-${photo.photo.id}`} className={i === coverTick % Math.min(3, album.photos.length) ? 'album-cover-photo visible' : 'album-cover-photo'} src={albumImage(photo)} alt="" loading="lazy"/>) : <div className="album-no-cover"><Compass size={55} strokeWidth={.8}/><span>A little room for wonder</span></div>}
            <span className="album-open"><ArrowUpRight size={19}/></span>
          </div><div className="album-place-name"><span>{album.country || 'Saved place'}</span><h3>{album.place}</h3></div><div className="album-caption"><span>{album.photos.length} {album.photos.length === 1 ? 'photo' : 'photos'}<span>·</span>{album.memories.length} {album.memories.length === 1 ? 'visit' : 'visits'}</span><time dateTime={album.latest}>{new Date(album.latest+'T12:00:00').toLocaleDateString('en-GB',{month:'short',year:'numeric'})}</time></div></div>
        </button>)}
      </div>
      <div className="album-shelf-footer"><span>{albums.length} {albums.length === 1 ? 'album' : 'albums'} <span>·</span> Most recently visited first</span>{overflow&&<div className="album-position" aria-hidden="true">{albums.map((a, i) => <span key={a.key} className={i === active ? 'active' : ''}/>)}</div>}</div>
    </> : <div className="albums-empty"><ImagePlus size={30} strokeWidth={1}/><div><h3>{loading ? 'Opening your albums…' : 'The first place is yours to choose.'}</h3><p>{loading ? 'Your photographs will be here in a moment.' : 'Add photos to a memory and we’ll gather them into a place album.'}</p></div>{!loading && <button className="primary" onClick={onAdd}><Plus size={15}/> Start an album</button>}</div>}
  </section>;
}

export function AlbumContents({album,onClose,onPhoto,onStory,onAdd}:{album:PlaceAlbum;onClose:()=>void;onPhoto:(index:number,items:AlbumPhoto[])=>void;onStory:(entry:Entry)=>void;onAdd:()=>void}){
  const [sort,setSort]=useState('newest');
  const photos=album.photos.map((photo,index)=>({...photo,index}));
  if(sort==='oldest')photos.sort((a,b)=>a.entry.date.localeCompare(b.entry.date)||a.index-b.index);
  return <><div className="album-dialog-heading"><div><div className="eyebrow green"><MapPin size={12}/>{album.country || 'YOUR PERSONAL TRAVEL ALBUM'}</div><h2>{album.place}</h2><p>{album.photos.length} photographs <span>·</span> {album.memories.length} {album.memories.length===1?'memory':'memories'} <span>·</span> A little piece of your world.</p></div><button className="icon-btn" type="button" onClick={onClose} aria-label="Close place album"><X size={23}/></button></div>
  {album.memories.length>1&&<><div className="album-visits-label">Visits to {album.place}</div><div className="album-visits">{album.memories.map(entry=><button className="album-visit" key={entry.id} onClick={()=>onStory(entry)}><span><small>{new Date(entry.date+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})} · {entry.photos.length} photos</small><strong>{entry.title}</strong></span><ArrowUpRight size={15}/></button>)}</div></>}
  {album.photos.length ? <><div className="album-gallery-toolbar"><span><Camera size={15}/> The moments, all together.</span><label>Photo order <select value={sort} onChange={event=>setSort(event.target.value)}><option value="newest">Newest visit first</option><option value="oldest">Oldest visit first</option></select></label></div><div className="album-photo-grid">{photos.map(({entry,photo,index},position)=><figure key={`${entry.id}-${photo.id}`}><button className="album-photo-button" onClick={()=>onPhoto(position,photos)} aria-label={`Open photo ${position+1}: ${photo.caption || entry.title}`}><img src={albumImage({entry,photo})} alt={photo.caption || entry.title} loading="lazy"/><span><ArrowUpRight size={19}/></span></button><figcaption>{photo.caption&&<p>{photo.caption}</p>}<button onClick={()=>onStory(entry)}>{entry.title} <ArrowUpRight size={12}/></button><time dateTime={entry.date}>{new Date(entry.date+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</time></figcaption></figure>)}</div></> : <div className="empty-state"><Camera size={35} strokeWidth={1}/><h3>The place is here. The photos are next.</h3><p>Add a photograph to a memory from {album.place} to fill this album.</p><button className="primary" onClick={onAdd}><Plus size={15}/> Add a memory</button></div>}
  <div className="album-dialog-footer"><span>Photos and notes from {album.place}.</span><button className="text-button" onClick={onClose}>Back to my places <ArrowRight size={15}/></button></div></>;
}
