'use client';
import { useEffect,useState } from 'react';
import { Check,Copy,Link2,LoaderCircle,X } from 'lucide-react';
import Modal from './modal';
import type { AlbumFolder } from './albums';

export default function ShareAlbum({album,onClose}:{album:AlbumFolder;onClose:()=>void}){
 const [url,setUrl]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[enabled,setEnabled]=useState(true),[copied,setCopied]=useState(false);
 async function change(next:boolean){setBusy(true);setError('');try{const response=await fetch('/api/shares',{method:next?'POST':'DELETE',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(album)});const result=await response.json() as {url:string;error?:string};if(!response.ok)throw Error(result.error||'Could not update this album link.');setUrl(result.url);setEnabled(next)}catch(err){setError((err as Error).message)}finally{setBusy(false)}}
 useEffect(()=>{void change(true)},[]);
 const close=()=>{if(!busy)onClose()};
 return <Modal label="Share album" onClose={close} className="create-album-modal"><div className="editor-heading"><div><div className="eyebrow green">ANYONE WITH THE LINK</div><h2>{album.place}</h2></div><button className="icon-btn" disabled={busy} onClick={close} aria-label="Close album sharing"><X size={22}/></button></div><div className="transfer-content"><p>This link opens this album's photos without login. Your other albums and private notes stay private.</p>{busy?<p role="status"><LoaderCircle size={16} className="spin"/> Updating album link…</p>:enabled&&url?<><label className="field">Album link<input readOnly value={url} onFocus={event=>event.target.select()}/></label><button className="primary" onClick={async()=>{try{await navigator.clipboard.writeText(url);setCopied(true)}catch{setError('Select the link above and copy it.')}}}>{copied?<Check size={16}/>:<Copy size={16}/>} {copied?'Link copied':'Copy album link'}</button><a className="text-button" href={url} target="_blank" rel="noopener noreferrer"><Link2 size={15}/> Open shared album</a><button className="text-button" onClick={()=>void change(false)}>Turn off this link</button></>:!enabled?<><p>Sharing is off. This link no longer opens the album.</p><button className="primary" onClick={()=>void change(true)}>Turn sharing back on</button></>:null}{error&&<p className="error-box" role="alert">{error}</p>}</div></Modal>;
}
