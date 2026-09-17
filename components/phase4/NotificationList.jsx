"use client";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {apiJSON} from "@/lib/phase4Client";
import "./phase4.css";
export default function NotificationList({data,onRefresh,onNavigate}) {
 const router=useRouter();
 async function mark(id){try{await apiJSON(id?"/api/notifications/"+id:"/api/notifications",{method:"PATCH"});if(onRefresh)await onRefresh();router.refresh();}catch(e){toast.error(e.message);}}
 return <><div className="phase4-row"><strong>{data.unread} unread</strong><button onClick={()=>mark()} disabled={!data.unread}>Mark all read</button></div>{!data.notifications.length&&<p>No notifications yet.</p>}{data.notifications.map(n=><article key={n._id} className={"notification-item "+(n.isRead?"":"notification-unread")}><Link href={n.link.startsWith("/")&&!n.link.startsWith("//")?n.link:"/notifications"} onClick={()=>{if(!n.isRead)void mark(n._id);onNavigate?.();}}><strong>{n.title}</strong><p>{n.message}</p><small>{new Date(n.createdAt).toLocaleString("en-IN")}</small></Link>{!n.isRead&&<button onClick={()=>mark(n._id)}>Mark read</button>}</article>)}</>;
}
