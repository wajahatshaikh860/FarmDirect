"use client";
import {useState,useEffect,useRef,useCallback} from "react";
import {Bell} from "lucide-react";
import Link from "next/link";
import {apiJSON} from "@/lib/phase4Client";
import NotificationList from "./NotificationList";
import "./phase4.css";
export default function NotificationBell() {
 const [loading,setLoading]=useState(true);const [data,setData]=useState({notifications:[],unread:0});const [open,setOpen]=useState(false);const [error,setError]=useState(false);const area=useRef(null);
 const refresh=useCallback(async()=>{try{const result=await apiJSON("/api/notifications");setData(result);setError(false);setLoading(false);}catch{setError(true);}},[]);
 useEffect(()=>{let alive=true;async function load(){try{const result=await apiJSON("/api/notifications");if(alive){setData(result);setError(false);}}catch{if(alive){setError(true);setLoading(false);}}}void load();const timer=setInterval(()=>{if(document.visibilityState==="visible")void load();},60000);const focus=()=>void load();window.addEventListener("focus",focus);return()=>{alive=false;clearInterval(timer);window.removeEventListener("focus",focus);};},[]);
 useEffect(()=>{if(!open)return;function outside(e){if(!area.current?.contains(e.target))setOpen(false);}function key(e){if(e.key==="Escape"){setOpen(false);area.current?.querySelector("button")?.focus();}}document.addEventListener("pointerdown",outside);document.addEventListener("keydown",key);return()=>{document.removeEventListener("pointerdown",outside);document.removeEventListener("keydown",key);};},[open]);
 return <div className="notification-area" ref={area}><button className="notification-bell" aria-label={"Notifications"+(data.unread?", "+data.unread+" unread":"")} aria-expanded={open} aria-controls="notification-panel" onClick={()=>{setOpen(!open);if(!open)void refresh();}}><Bell size={20}/>{data.unread>0&&<span className="notification-count">{data.unread>99?"99+":data.unread}</span>}</button>{open&&<div className="notification-popover" id="notification-panel" aria-label="Recent notifications"><h3>Notifications</h3>{loading?<p role="status">Loading notifications…</p>:error?<p>Notifications currently unavailable. <button onClick={refresh}>Retry</button></p>:<NotificationList data={{...data,notifications:data.notifications.slice(0,8)}} onRefresh={refresh} onNavigate={()=>setOpen(false)}/>}<Link href="/notifications" onClick={()=>setOpen(false)}>View all notifications</Link></div>}</div>;
}
