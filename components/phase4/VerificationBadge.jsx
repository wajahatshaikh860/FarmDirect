import {ShieldCheck} from "lucide-react";
import "./phase4.css";
export default function VerificationBadge({status}){return status==="VERIFIED"?<span className="verification-badge"><ShieldCheck size={15}/>Verified farmer</span>:null;}
