'use client';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {ArrowUpRight,BookOpen,Compass,Map as MapIcon,MapPin,Menu,Mountain,RefreshCw,Stamp} from 'lucide-react';
import TravelCover from './travel-cover';
import {PlaceAlbums,AlbumContents} from './place-albums';
import {StoriesShelf,StoryViewer,storyStamp} from './travel-stories';
import {Lightbox,WorldMap,type Entry} from './journal';
import {albumKeyFor,albumImage,type AlbumPhoto,type PlaceAlbum} from './albums';
import type {SharedAlbum} from './shared-albums';
import {CLOUD_JOURNAL_URL} from './cloud-link';
import Modal from './modal';
import {publicPlaceLocation,publicPlaceMapUrl} from './public-places';

export function sharedPlaceAlbum(shared:SharedAlbum,origin:string):PlaceAlbum{
 const photos=shared.photos.map(photo=>({id:photo.id,caption:photo.caption,url:new URL(photo.url,origin).href}));
 // This adapter supplies the photo components, without inventing a visit or publishing private entry details.
 const location=publicPlaceLocation(shared.place,shared.country);
 const entry:Entry={id:'shared-'+shared.token,title:shared.place,location:shared.place,country:shared.country,date:'',category:'Roaming',mood:'Peaceful',story:'',trip:'',rating:0,cost:'',favorite:false,lat:location?.lat??null,lng:location?.lng??null,photos};
 return {key:albumKeyFor(shared.place,shared.country),place:shared.place,country:shared.country,memories:[],latest:'',photos:photos.map(photo=>({entry,photo}))};
}
const empty:SharedAlbum={token:'panchpokhari',place:'Panchpokhari',country:'',photos:[]};
export default function PublicHomepage(){
 const [shared,setShared]=useState<SharedAlbum|null>(empty),[loading,setLoading]=useState(true),[refreshing,setRefreshing]=useState(false),[error,setError]=useState('');
 const [tab,setTab]=useState('Journal'),[mobile,setMobile]=useState(false),[albumKey,setAlbumKey]=useState<string|null>(null),[storyKey,setStoryKey]=useState<string|null>(null),[seen,setSeen]=useState<Record<string,string>>({});
 const [gallery,setGallery]=useState<{entry:Entry;index:number;items:AlbumPhoto[];title:string}|null>(null);
 const request=useRef(false),alive=useRef(true),linked=useRef(false);
 const albums=useMemo(()=>shared?[sharedPlaceAlbum(shared,CLOUD_JOURNAL_URL)]:[],[shared]);
 const mapEntries=albums.flatMap(album=>album.photos[0]?[album.photos[0].entry]:[]).filter(entry=>entry.lat!==null&&entry.lng!==null);
 const mapCenter=mapEntries[0]?{lat:mapEntries[0].lat!,lng:mapEntries[0].lng!}:undefined;
 const current=albums.find(album=>album.key===albumKey);
 useEffect(()=>{setGallery(previous=>{if(!previous)return previous;const items=albums.flatMap(album=>album.photos),selected=previous.items[previous.index]?.photo.id,index=items.findIndex(item=>item.photo.id===selected);return index<0?null:{...previous,entry:items[index].entry,index,items}})},[albums]);
 const refresh=useCallback(async()=>{
  if(request.current)return;request.current=true;setRefreshing(true);
  try{
   const response=await fetch(CLOUD_JOURNAL_URL+'/api/shared/panchpokhari',{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(20000)});
   if(response.status===404){if(alive.current){setShared(null);setAlbumKey(null);setStoryKey(null);setGallery(null);setError('This album is no longer shared.')}return}
   if(!response.ok)throw Error('Photos could not load. Please refresh the journal.');
   const data=await response.json() as SharedAlbum;if(alive.current){setShared(data);setError('')}
  }catch(err){if(alive.current)setError((err as Error).message)}finally{request.current=false;if(alive.current){setLoading(false);setRefreshing(false)}}
 },[]);
 useEffect(()=>{alive.current=true;void refresh();const update=()=>{if(!document.hidden)void refresh()};const timer=window.setInterval(update,30000);window.addEventListener('focus',update);window.addEventListener('online',update);document.addEventListener('visibilitychange',update);return()=>{alive.current=false;clearInterval(timer);window.removeEventListener('focus',update);window.removeEventListener('online',update);document.removeEventListener('visibilitychange',update)}},[refresh]);
 useEffect(()=>{if(loading||linked.current)return;linked.current=true;const name=new URLSearchParams(window.location.search).get('album');if(name){const album=albums.find(album=>album.place.toLowerCase()===name.toLowerCase());if(album)setAlbumKey(album.key)}},[loading,albums]);
 const navigate=(next:string)=>{setTab(next);setMobile(false);window.requestAnimationFrame(()=>next==='Journal'?window.scrollTo({top:0,behavior:'smooth'}):document.getElementById('collection')?.scrollIntoView({behavior:'smooth',block:'start'}))};
 const browse=()=>{setTab('Journal');window.requestAnimationFrame(()=>document.getElementById('place-albums')?.scrollIntoView({behavior:'smooth',block:'start'}))};
 const open=(album:PlaceAlbum)=>setAlbumKey(album.key);
 return <>
  <header className="site-header"><a className="brand" href={import.meta.env.BASE_URL||'/'} onClick={event=>{event.preventDefault();navigate('Journal')}} aria-label="Wanderbook home"><span className="brand-icon"><Compass size={24} strokeWidth={1.5}/></span><span className="brand-lockup"><span>wanderbook<span className="brand-dot">.</span></span></span></a><nav className={mobile?'nav mobile-open':'nav'} aria-label="Main navigation">{[{name:'Journal',Icon:BookOpen},{name:'My map',Icon:MapIcon},{name:'Passport',Icon:Stamp}].map(({name,Icon})=><button key={name} className={'nav-item '+(tab===name?'active':'')} onClick={()=>navigate(name)}><Icon size={16}/><span>{name}</span></button>)}</nav><div className="header-actions"><button className="icon-btn public-home-refresh" aria-label="Refresh shared albums" disabled={refreshing} onClick={()=>void refresh()}><RefreshCw size={16} className={refreshing?'spin':''}/></button><a className="primary small" href={CLOUD_JOURNAL_URL+'/signin-with-chatgpt?return_to=/'} target="_blank" rel="noopener noreferrer">Manage journal <ArrowUpRight size={15}/></a><button className="icon-btn mobile-menu" aria-label="Toggle navigation" onClick={()=>setMobile(!mobile)}><Menu size={22}/></button></div></header>
  {error&&<div className="public-home-error error-box" role="alert">{error}<button className="text-button" onClick={()=>void refresh()}>Refresh</button></div>}
  <main>{tab==='Journal'?<><TravelCover albums={albums} sample={false} memories={0} photos={shared?.photos.length||0} places={albums.length} onAdd={browse} onBrowse={browse} onOpen={open} readOnly/><StoriesShelf albums={albums} sample={false} seen={seen} onOpen={setStoryKey} onAdd={browse} readOnly/><PlaceAlbums albums={albums} sample={false} loading={loading} onOpen={open} onAdd={browse} readOnly/></>:<section id="collection" className="collection"><div className="collection-top"><h2>{tab==='My map'?'Your map':'Places visited'}</h2></div>{tab==='My map'?<><WorldMap entries={mapEntries} center={mapCenter} showLabels onSelect={entry=>{const album=albums.find(album=>album.photos.some(item=>item.entry.id===entry.id));if(album)open(album)}} caption={mapEntries.length?"Select a pin to open its album. Drag to explore.":"Drag to explore. Choose a shared place below."}/><div className="map-cards">{albums.map(album=><button key={album.key} onClick={()=>open(album)}>{album.photos[0]&&<img src={albumImage(album.photos[0])} alt=""/>}<span><strong>{album.place}</strong><small>{album.photos.length} photos</small></span><ArrowUpRight size={17}/></button>)}</div><div className="public-map-links">{albums.map(album=><a className="text-button" key={album.key} href={publicPlaceMapUrl(album.place,album.country)} target="_blank" rel="noopener noreferrer"><MapPin size={14}/> View {album.place} on the map <ArrowUpRight size={14}/></a>)}</div></>:<div className="passport"><div className="passport-intro"><Compass size={48} strokeWidth={1}/><div className="eyebrow">WANDERBOOK EXPLORER’S PASSPORT</div><h3>Leave a little<br/><em>piece of your heart.</em></h3><p>{albums.length} {albums.length===1?'place':'places'} shared</p><span className="passport-id">TRAVEL COLLECTION</span></div><div className="stamps">{albums.map((album,index)=><button className={'travel-stamp stamp-'+index%3} key={album.key} onClick={()=>open(album)} style={{transform:`rotate(${[-5,4,-2,6][index%4]}deg)`}}><span>PHOTO ALBUM</span><Mountain size={29} strokeWidth={1}/><strong>{album.place}</strong><small>{album.country||'A place worth keeping'}</small><span>{album.photos.length} photographs</span></button>)}</div></div>}</section>}</main>
  <footer className="public-home-footer"><span className="footer-wordmark">wanderbook.</span><span>Shared with you. No account needed.</span></footer>
  {current&&<Modal label={`${current.place} photo album`} className="album-dialog" onClose={()=>setAlbumKey(null)}><AlbumContents album={current} onClose={()=>setAlbumKey(null)} onPhoto={(index,items)=>setGallery({entry:items[index].entry,index,items,title:current.place})} onStory={()=>{}} onAdd={()=>{}} readOnly/></Modal>}
  {storyKey&&<StoryViewer albums={albums} startKey={storyKey} onClose={()=>setStoryKey(null)} onAlbum={album=>{setStoryKey(null);open(album)}} onSeen={album=>setSeen(previous=>({...previous,[album.key]:storyStamp(album)}))} readOnly/>}
  {gallery&&<Lightbox value={gallery} onClose={()=>setGallery(null)} onChange={index=>setGallery({...gallery,index})}/>}
 </>;
}
