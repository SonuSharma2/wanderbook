'use client';
import { useEffect,useRef,type ReactNode } from 'react';
export default function Modal({children,onClose,className='',label}:{children:ReactNode;onClose:()=>void;className?:string;label:string}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const dialog=ref.current;dialog?.showModal();const old=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{dialog?.close();document.body.style.overflow=old}},[]);
 return <dialog ref={ref} aria-label={label} className={'modal '+className} onCancel={event=>{event.preventDefault();onClose()}} onClick={event=>{if(event.target===event.currentTarget)onClose()}}><div className="modal-inner">{children}</div></dialog>;
}
