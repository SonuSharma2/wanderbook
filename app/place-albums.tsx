'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Camera, ChevronLeft, ChevronRight, Compass, ImagePlus, MapPin, Pause, Play, Plus, Share2, Trash2, X } from 'lucide-react';
import { albumImage, type AlbumPhoto, type PlaceAlbum } from './albums';
import type { Entry } from './journal';
import Modal from './modal';

export function PlaceAlbums({ albums, sample, loading, onOpen, onAdd, onCreate, readOnly=false }: {
  albums: PlaceAlbum[]; sample: boolean; loading: boolean; onOpen: (album: PlaceAlbum) => void; onAdd: () => void; onCreate?: () => void;readOnly?:boolean;
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
    <div className="albums-heading"><div><h2>Albums</h2></div><div className="album-controls">
      {onCreate&&<button type="button" className="album-create secondary" onClick={onCreate}><Plus size={14}/> Create album</button>}
      <button className="album-motion" type="button" onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pause album animations' : 'Play album animations'} aria-pressed={playing}>{playing ? <Pause size={14}/> : <Play size={14}/>}</button>
      {overflow && <><button type="button" className="album-arrow" onClick={() => go(-1)} aria-label="Previous place albums"><ChevronLeft size={18}/></button><button type="button" className="album-arrow" onClick={() => go(1)} aria-label="Next place albums"><ChevronRight size={18}/></button></>}
    </div></div>
    {albums.length ? <>
      <div className="album-rail" ref={rail} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }} onPointerDown={event => { if (event.pointerType !== 'mouse') setTouching(true); }} onPointerUp={() => setTouching(false)} onPointerCancel={() => setTouching(false)} onScroll={() => { const element = rail.current; if (element?.children[0]) setActive(Math.round(element.scrollLeft / ((element.children[0] as HTMLElement).offsetWidth + 26))); }}>
        {albums.map((album, index) => <button key={album.key} type="button" className="place-album" style={{ '--album-delay': `${index * -.9}s`, '--album-tilt': `${[-3, 2, -1, 3][index % 4]}deg` } as React.CSSProperties} onClick={() => onOpen(album)} aria-label={`Open album: ${album.place}${album.country ? `, ${album.country}` : ''}, ${album.photos.length} photos`}>
          <div className="album-front"><div className="album-cover">
            {album.photos.length ? album.photos.slice(0, 3).map((photo, i) => <img key={`${photo.entry.id}-${photo.photo.id}`} className={i === coverTick % Math.min(3, album.photos.length) ? 'album-cover-photo visible' : 'album-cover-photo'} src={albumImage(photo)} alt="" loading="lazy"/>) : <div className="album-no-cover"><ImagePlus size={55} strokeWidth={.8}/><span>Add your photos</span></div>}
            <span className="album-open"><ArrowUpRight size={19}/></span>
          </div><div className="album-place-name"><h3>{album.place}</h3></div><div className="album-caption"><span>{album.photos.length} {album.photos.length === 1 ? 'photo' : 'photos'}</span>{album.latest&&<time dateTime={album.latest}>{new Date(album.latest+'T12:00:00').toLocaleDateString('en-GB',{month:'short',year:'numeric'})}</time>}</div></div>
        </button>)}
      </div>
      <div className="album-shelf-footer">{overflow&&<div className="album-position" aria-hidden="true">{albums.map((a, i) => <span key={a.key} className={i === active ? 'active' : ''}/>)}</div>}</div>
    </> : <div className="albums-empty"><ImagePlus size={30} strokeWidth={1}/><div><h3>{loading ? 'Opening your albums…' : readOnly?'No albums shared yet.':'The first place is yours to choose.'}</h3><p>{loading ? 'Your photographs will be here in a moment.' : readOnly?'Shared photographs will appear here.':'Add photos to a memory and we’ll gather them into a place album.'}</p></div>{!loading && !readOnly && <button className="primary" onClick={onAdd}><Plus size={15}/> Start an album</button>}</div>}
  </section>;
}

export function AlbumContents({album,onClose,onPhoto,onStory,onAdd,onShare,onRemove,readOnly=false}:{album:PlaceAlbum;onClose:()=>void;onPhoto:(index:number,items:AlbumPhoto[])=>void;onStory:(entry:Entry)=>void;onAdd:()=>void;onShare?:()=>void;onRemove?:(photos:AlbumPhoto[])=>Promise<void>;readOnly?:boolean}){
  const [sort,setSort]=useState('newest');
  const [selecting,setSelecting]=useState(false),[selected,setSelected]=useState<Set<string>>(new Set());
  const [confirming,setConfirming]=useState(false),[busy,setBusy]=useState(false),[removeError,setRemoveError]=useState('');
  const photoKey=({entry,photo}:AlbumPhoto)=>`${entry.id}/${photo.id}`;
  const selectedPhotos=album.photos.filter(item=>selected.has(photoKey(item)));
  const canSelect=!readOnly&&!!onRemove;
  useEffect(()=>{setSelected(new Set());setSelecting(false);setConfirming(false);setRemoveError('')},[album.key]);
  const toggle=(item:AlbumPhoto)=>setSelected(previous=>{const next=new Set(previous),key=photoKey(item);if(next.has(key))next.delete(key);else next.add(key);return next});
  const cancelSelection=()=>{setSelecting(false);setSelected(new Set());setRemoveError('')};
  const confirmRemove=async()=>{
    if(!selectedPhotos.length||!onRemove||busy)return;
    setBusy(true);setRemoveError('');
    try{await onRemove(selectedPhotos);setConfirming(false);cancelSelection()}
    catch(error){setRemoveError((error as Error).message||'The selected photos could not be removed. Please try again.')}
    finally{setBusy(false)}
  };
  const photos=album.photos.map((photo,index)=>({...photo,index}));
  if(sort==='oldest')photos.sort((a,b)=>a.entry.date.localeCompare(b.entry.date)||a.index-b.index);
  return <>
    <div className="album-dialog-heading"><div><div className="eyebrow green"><MapPin size={12}/>{album.country || 'YOUR PERSONAL TRAVEL ALBUM'}</div><h2>{album.place}</h2><p>{album.photos.length} {album.photos.length===1?'photo':'photos'}</p></div><div className="album-dialog-actions">{onShare&&<button className="secondary" type="button" onClick={onShare}><Share2 size={15}/> Share album</button>}{!readOnly&&!!album.photos.length&&<button className="primary small" type="button" onClick={onAdd}><ImagePlus size={16}/> Upload photos</button>}<button className="icon-btn" type="button" onClick={onClose} aria-label="Close place album"><X size={23}/></button></div></div>
    {!readOnly&&album.memories.length>1&&<><div className="album-visits-label">Visits to {album.place}</div><div className="album-visits">{album.memories.map(entry=><button className="album-visit" key={entry.id} onClick={()=>onStory(entry)}><span><small>{new Date(entry.date+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})} / {entry.photos.length} photos</small><strong>{entry.title}</strong></span><ArrowUpRight size={15}/></button>)}</div></>}
    {album.photos.length ? <>
      <div className={'album-gallery-toolbar '+(selecting?'album-selection-toolbar':'')}>
        {selecting&&canSelect?<>
          <span role="status" aria-live="polite">{selectedPhotos.length} selected</span>
          <div className="album-selection-actions">
            <button className="secondary" type="button" onClick={()=>setSelected(selectedPhotos.length===album.photos.length?new Set():new Set(album.photos.map(photoKey)))}>{selectedPhotos.length===album.photos.length?'Clear selection':'Select all'}</button>
            <button className="secondary" type="button" aria-label="Cancel photo selection" onClick={cancelSelection}>Cancel</button>
            <button className="danger" type="button" disabled={!selectedPhotos.length} onClick={()=>{setRemoveError('');setConfirming(true)}}><Trash2 size={15}/>Remove selected ({selectedPhotos.length})</button>
          </div>
        </>:<>
          <span><Camera size={15}/> The moments, all together.</span>
          <div className="album-browse-tools">{!readOnly&&<label>Photo order <select value={sort} onChange={event=>setSort(event.target.value)}><option value="newest">Newest visit first</option><option value="oldest">Oldest visit first</option></select></label>}{canSelect&&<button className="secondary" type="button" onClick={()=>setSelecting(true)}>Select photos</button>}</div>
        </>}
      </div>
      <div className="album-photo-grid">{photos.map(({entry,photo},position)=>{
        const item={entry,photo},checked=selected.has(photoKey(item));
        return <figure key={photoKey(item)} className={selecting&&checked?'album-photo-selected':''}>
          <div className="album-photo-frame"><button className="album-photo-button" type="button" onClick={()=>selecting&&canSelect?toggle(item):onPhoto(position,photos)} aria-pressed={selecting&&canSelect?checked:undefined} aria-label={`${selecting&&canSelect?'Select':'Open'} photo ${position+1}: ${photo.caption || entry.title}`}><img src={albumImage(item)} alt={photo.caption || entry.title} loading="lazy"/>{!selecting&&<span><ArrowUpRight size={19}/></span>}</button>{selecting&&canSelect&&<label className="album-photo-checkbox"><input type="checkbox" aria-label={`Select photo ${position+1}`} checked={checked} onChange={()=>toggle(item)}/></label>}</div>
          <figcaption>{photo.caption&&<p>{photo.caption}</p>}{!readOnly&&<button onClick={()=>onStory(entry)}>{entry.title} <ArrowUpRight size={12}/></button>}{!readOnly&&<time dateTime={entry.date}>{new Date(entry.date+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</time>}</figcaption>
        </figure>
      })}</div>
    </>:<div className="empty-state album-upload-empty"><ImagePlus size={43} strokeWidth={1}/><h3>Your album is ready.</h3><p>Add your first photos from {album.place}.</p>{!readOnly&&<button className="primary" onClick={onAdd}><Plus size={15}/> Upload photos</button>}</div>}
    <div className="album-dialog-footer"><span>{readOnly?'Photos':'Photos and notes'} from {album.place}.</span><button className="text-button" onClick={onClose}>Back to my places <ArrowRight size={15}/></button></div>
    {confirming&&canSelect&&<Modal label="Remove selected photos" className="remove-photo-modal" onClose={()=>{if(!busy)setConfirming(false)}}><div className="remove-photo-content">
      <div className={'remove-photo-previews '+(selectedPhotos.length===1?'single':'')}>{selectedPhotos.map(item=><img key={photoKey(item)} src={albumImage(item)} alt={item.photo.caption||item.entry.title}/>)}</div>
      <h2>Remove {selectedPhotos.length===1?'this photo':`these ${selectedPhotos.length} photos`}?</h2>
      <p>This permanently deletes the selected {selectedPhotos.length===1?'photo':'photos'} from your journal and shared album. Your other photos and notes stay.</p>
      {removeError&&<p className="error-box" role="alert">{removeError}</p>}
      <div className="remove-photo-actions"><button className="secondary" type="button" autoFocus disabled={busy} onClick={()=>setConfirming(false)}>Keep selected</button><button className="danger" type="button" disabled={busy||!selectedPhotos.length} onClick={()=>void confirmRemove()}><Trash2 size={15}/>{busy?'Removing...':`Remove ${selectedPhotos.length} ${selectedPhotos.length===1?'photo':'photos'}`}</button></div>
    </div></Modal>}
  </>;
}
