'use client';
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type MouseEvent } from 'react';

export function useSweep({enabled=true,onStep,onTap,onHold,onDismiss}:{enabled?:boolean;onStep:(direction:number)=>void;onTap?:(x:number,width:number)=>void;onHold?:(holding:boolean)=>void;onDismiss?:()=>void}){
 const callbacks=useRef({onStep,onTap,onHold,onDismiss});callbacks.current={onStep,onTap,onHold,onDismiss};
 const gesture=useRef<{x:number;y:number;time:number;width:number;axis:''|'x'|'y';id:number}|null>(null);
 const suppressClick=useRef(false),timers=useRef<ReturnType<typeof setTimeout>[]>([]),locked=useRef(false),surface=useRef<HTMLElement|null>(null);
 const [offset,setOffset]=useState(0),[phase,setPhase]=useState('idle'),[direction,setDirection]=useState(1),[reduced,setReduced]=useState(false);
 useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(media.matches);update();media.addEventListener('change',update);return()=>{media.removeEventListener('change',update);timers.current.forEach(clearTimeout)}},[]);
 const later=(fn:()=>void,ms:number)=>{const timer=setTimeout(()=>{timers.current=timers.current.filter(t=>t!==timer);fn()},ms);timers.current.push(timer)};
 const transition=(commit:()=>void,step:number,width=surface.current?.getBoundingClientRect().width||700)=>{
  if(locked.current)return;setDirection(step);locked.current=true;
  if(reduced){commit();setOffset(0);setPhase('idle');locked.current=false;return}
  setPhase('leaving');setOffset(-step*width*1.15);
  later(()=>{commit();setOffset(0);setPhase('entering');later(()=>{setPhase('idle');locked.current=false},330)},280);
 };
 const settle=()=>{setOffset(0);setPhase('settling');later(()=>setPhase('idle'),350)};
 const down=(event:ReactPointerEvent<HTMLElement>)=>{
  if(!gesture.current)suppressClick.current=false;
  if(event.button!==0||locked.current||gesture.current||(event.target as Element).closest('button,a,input,textarea,select'))return;
  timers.current.forEach(clearTimeout);timers.current=[];event.currentTarget.setPointerCapture?.(event.pointerId);
  suppressClick.current=false;const width=event.currentTarget.getBoundingClientRect().width||700;
  gesture.current={x:event.clientX,y:event.clientY,time:performance.now(),width,axis:'',id:event.pointerId};callbacks.current.onHold?.(true);
 };
 const move=(event:ReactPointerEvent<HTMLElement>)=>{
  const start=gesture.current;if(!start||event.pointerId!==start.id)return;
  const dx=event.clientX-start.x,dy=event.clientY-start.y;
  if(!start.axis&&Math.max(Math.abs(dx),Math.abs(dy))>7){start.axis=Math.abs(dx)>Math.abs(dy)*1.15?'x':'y';if(start.axis==='x'&&enabled){event.currentTarget.setPointerCapture?.(event.pointerId);setPhase('dragging');suppressClick.current=true}}
  if(start.axis==='x'&&enabled){if(event.cancelable)event.preventDefault();setOffset(Math.max(-start.width,Math.min(start.width,dx)));setDirection(dx<0?1:-1)}
 };
 const up=(event:ReactPointerEvent<HTMLElement>)=>{
  const start=gesture.current;if(!start||event.pointerId!==start.id)return;gesture.current=null;callbacks.current.onHold?.(false);
  const dx=event.clientX-start.x,dy=event.clientY-start.y,elapsed=performance.now()-start.time;
  if(start.axis==='x'&&enabled){const enough=Math.abs(dx)>Math.min(95,start.width*.18)||(Math.abs(dx)>30&&Math.abs(dx)/Math.max(1,elapsed)>.55);if(enough)transition(()=>callbacks.current.onStep(dx<0?1:-1),dx<0?1:-1,start.width);else settle()}
  else if(start.axis==='y'&&dy>100&&Math.abs(dy)>Math.abs(dx)*1.4)callbacks.current.onDismiss?.();
  else if(!start.axis&&elapsed<320)callbacks.current.onTap?.(event.clientX-event.currentTarget.getBoundingClientRect().left,start.width);
 };
 const cancel=()=>{if(!gesture.current)return;gesture.current=null;callbacks.current.onHold?.(false);settle()};
 const props={ref:(node:HTMLElement|null)=>{surface.current=node},onPointerDown:down,onPointerMove:move,onPointerUp:up,onPointerCancel:cancel,onLostPointerCapture:cancel,onDragStart:(e:React.DragEvent)=>e.preventDefault(),onClickCapture:(event:MouseEvent)=>{if(suppressClick.current){event.preventDefault();event.stopPropagation();suppressClick.current=false}}};
 const style={'--sweep-x':`${offset}px`,'--sweep-turn':`${Math.max(-8,Math.min(8,offset/65))}deg`,'--sweep-in':`${direction*55}px`} as CSSProperties;
 return {props,style,phase,direction,busy:phase==='leaving'||phase==='entering'||phase==='dragging',step:(step:number)=>{if(enabled)transition(()=>callbacks.current.onStep(step),step)},select:(commit:()=>void,step:number)=>transition(commit,step)};
}
