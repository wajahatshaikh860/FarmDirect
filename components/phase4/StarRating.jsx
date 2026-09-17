"use client";
import {useState} from "react";
import {Star} from "lucide-react";
export default function StarRating({value=0,onChange,disabled=false}) {
 const [hover,setHover]=useState(0);
 if(!onChange)return <span className="rating-stars" aria-label={value.toFixed(1)+" out of 5 stars"}>{[1,2,3,4,5].map(n=><Star key={n} size={19} className={n<=Math.round(value)?"filled":""}/>)}</span>;
 return <div className="rating-stars" role="group" aria-label="Rating">{[1,2,3,4,5].map(n=><button key={n} type="button" disabled={disabled} aria-label={n+" star"+(n===1?"":"s")} aria-pressed={value===n} onMouseEnter={()=>setHover(n)} onMouseLeave={()=>setHover(0)} onFocus={()=>setHover(n)} onBlur={()=>setHover(0)} onClick={()=>onChange(n)}><Star size={24} className={n<=(hover||value)?"filled":""}/></button>)}</div>;
}
