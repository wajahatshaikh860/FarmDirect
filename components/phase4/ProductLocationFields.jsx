"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {forwardGeocode,validCoordinates,locationQuery} from "@/lib/farmLocation";
import FarmMap from "./FarmMap";
import "./phase4.css";
const labels={addressLine:"Full Address",village:"Village / City",district:"District",state:"State",postalCode:"Pincode"};
export default function ProductLocationFields({location={},disabled,errors={}}) {
 const [address,setAddress]=useState(()=>Object.fromEntries(Object.keys(labels).map(k=>[k,location[k]||""])));
 const [coordinates,setCoordinates]=useState(validCoordinates(location)?{latitude:location.latitude,longitude:location.longitude}:null);
 const [suggestions,setSuggestions]=useState([]);const [message,setMessage]=useState("");const [searching,setSearching]=useState(false);
 const controller=useRef(null);const initial=useRef(locationQuery(address));const key=process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
 const find=useCallback(async()=>{controller.current?.abort();const abort=new AbortController();controller.current=abort;const timeout=setTimeout(()=>abort.abort(),10000);setSearching(true);
 try{const results=await forwardGeocode(address,{key,signal:abort.signal});if(abort!==controller.current)return;setSuggestions(results);setCoordinates(results[0]||null);setMessage(results.length?"Location detected. Choose a suggestion if needed.":"Location saved, but map coordinates could not be detected.");}
 catch{if(abort===controller.current){setCoordinates(null);setSuggestions([]);setMessage("Location saved, but map coordinates could not be detected.");}}
 finally{clearTimeout(timeout);if(abort===controller.current)setSearching(false);}},[address,key]);
 useEffect(()=>{if(locationQuery(address)===initial.current)return;const timer=setTimeout(()=>{if(address.district.trim().length>=2&&address.state.trim().length>=2)void find();},500);return()=>{clearTimeout(timer);controller.current?.abort();};},[address,find]);
 useEffect(()=>()=>controller.current?.abort(),[]);
 function change(name,value){controller.current?.abort();controller.current=null;setSearching(false);setAddress(old=>({...old,[name]:value}));setCoordinates(null);setSuggestions([]);setMessage("");}
 return <section className="phase4-card location-fields"><h2>Farm Location</h2><p className="muted">Enter your address to detect the location automatically. Exact address is kept private.</p><div className="location-inputs">{Object.entries(labels).map(([name,label])=><label key={name} className={"field "+(name==="addressLine"?"wide":"")}><span>{label}</span><input name={name} value={address[name]} onChange={e=>change(name,e.target.value)} disabled={disabled} required={name==="district"||name==="state"} maxLength={name==="addressLine"?200:name==="postalCode"?6:100} inputMode={name==="postalCode"?"numeric":undefined} pattern={name==="postalCode"?"[1-9][0-9]{5}":undefined}/>{errors["location."+name]&&<small className="field-error">{errors["location."+name][0]}</small>}</label>)}</div><input type="hidden" name="latitude" value={coordinates?.latitude??""}/><input type="hidden" name="longitude" value={coordinates?.longitude??""}/><div className="phase4-actions"><button type="button" disabled={disabled||searching} onClick={find}>{searching?"Finding location…":"Find Location"}</button></div><p role="status">{!key?"Map unavailable until a MapTiler key is configured. You can still save this product.":message}</p>{suggestions.length>1&&<ul className="location-suggestions" aria-label="Location suggestions">{suggestions.map((s,i)=><li key={i}><button type="button" disabled={disabled} onClick={()=>{setCoordinates(s);setSuggestions([]);setMessage("Location selected.");}}>{s.label}</button></li>)}</ul>}{coordinates&&<FarmMap key={coordinates.latitude+":"+coordinates.longitude} location={{...address,...coordinates}}/>}</section>;
}
