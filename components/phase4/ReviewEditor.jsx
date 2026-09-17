"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {apiJSON} from "@/lib/phase4Client";
import StarRating from "./StarRating";
import "./phase4.css";
export default function ReviewEditor({review,order,product,productName,initialOpen=false}) {
 const router=useRouter();const [editing,setEditing]=useState(initialOpen||!review);const [rating,setRating]=useState(review?.rating||0);const [comment,setComment]=useState(review?.comment||"");const [busy,setBusy]=useState(false);
 async function save(e){e.preventDefault();if(!rating){toast.error("Choose a rating from 1 to 5.");return;}setBusy(true);try{await apiJSON(review?"/api/reviews/"+review._id:"/api/reviews",{method:review?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(review?{rating,comment}:{rating,comment,order,product})});toast.success("Review saved");setEditing(false);router.refresh();}catch(e){toast.error(e.message);}finally{setBusy(false);}}
 async function remove(){if(!window.confirm("Delete your review?"))return;setBusy(true);try{await apiJSON("/api/reviews/"+review._id,{method:"DELETE"});toast.success("Review deleted");router.refresh();}catch(e){toast.error(e.message);}finally{setBusy(false);}}
 return <div className="phase4-review"><h3>{review?"Your Review":"Write a Review"}{productName?" — "+productName:""}</h3>{editing?<form onSubmit={save}><StarRating value={rating} onChange={setRating} disabled={busy}/><label className="field"><span>Comment</span><textarea value={comment} onChange={e=>setComment(e.target.value)} maxLength={2000} disabled={busy}/></label><div className="phase4-actions"><button disabled={busy} type="submit">{busy?"Saving…":"Submit Review"}</button>{review&&<button type="button" onClick={()=>setEditing(false)} disabled={busy}>Cancel</button>}</div></form>:<><StarRating value={review?.rating||rating}/><blockquote>{review?.comment||comment}</blockquote><div className="phase4-actions"><button disabled={busy} onClick={()=>setEditing(true)}>Edit</button><button disabled={busy} onClick={remove}>Delete</button></div></>}</div>;
}
