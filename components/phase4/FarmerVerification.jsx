"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {apiJSON} from "@/lib/phase4Client";
import VerificationBadge from "./VerificationBadge";
import "./phase4.css";
export default function FarmerVerification({farmers}) {
 const [busy,setBusy]=useState(null);const router=useRouter();
 async function change(farmer,status){if(!window.confirm((status==="VERIFIED"?"Verify ":"Reject verification for ")+farmer.name+"?"))return;setBusy(farmer._id);try{await apiJSON("/api/admin/farmers/"+farmer._id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({verificationStatus:status})});toast.success("Verification updated");router.refresh();}catch(e){toast.error(e.message);}finally{setBusy(null);}}
 return <><header><span className="eyebrow">FARMER TRUST</span><h1>Farmer Verification</h1><p>Verification adds a trust badge. Farmers can sell while verification is pending.</p></header>{!farmers.length&&<section className="phase4-card"><h2>No farmers registered yet</h2></section>}{farmers.length>0&&!farmers.some(f=>f.verificationStatus==="PENDING")&&<p>No farmers awaiting verification.</p>}<div className="phase4-grid">{farmers.map(f=><article key={f._id} className="phase4-card"><h2>{f.name}</h2><VerificationBadge status={f.verificationStatus}/><p>{f.email}<br/>{f.phone||"Phone not provided"}</p><p>{f.farmerProfile?.farmName||"Farm name not provided"} · {f.farmerProfile?.farmingType||"Farming type not provided"}</p><p>{[f.address?.village,f.address?.district,f.address?.state].filter(Boolean).join(", ")||"Location not provided"}</p><p>Registered {new Date(f.createdAt).toLocaleDateString("en-IN",{timeZone:"UTC"})}</p><strong>Status: {f.verificationStatus}</strong><div className="phase4-actions"><button disabled={busy===f._id||f.verificationStatus==="VERIFIED"} onClick={()=>change(f,"VERIFIED")}>{busy===f._id?"Updating…":"Verify"}</button><button disabled={busy===f._id||f.verificationStatus==="REJECTED"} onClick={()=>change(f,"REJECTED")}>Reject</button></div></article>)}</div>{farmers.length===200&&<p>Showing the 200 most recently registered farmers.</p>}</>;
}
