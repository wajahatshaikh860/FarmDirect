import {requireRole} from "@/lib/permissions";
import {getFarmers} from "@/services/verificationService";
import CommerceShell from "@/components/commerce/CommerceShell";
import FarmerVerification from "@/components/phase4/FarmerVerification";
export const metadata={title:"Farmer Verification"};
export default async function Page(){const user=await requireRole("ADMIN");return <CommerceShell role="ADMIN" activeLabel="Farmers"><FarmerVerification farmers={await getFarmers(user)}/></CommerceShell>;}
