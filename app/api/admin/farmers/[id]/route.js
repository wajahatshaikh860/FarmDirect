import {NextResponse} from "next/server";
import {requireProductUser} from "@/lib/productPermissions";
import {productErrorResponse} from "@/lib/productResponses";
import {requireProductOrigin} from "@/lib/productRequest";
import {readCommerceRequest} from "@/lib/commerceRequest";
import {verifyFarmer} from "@/services/verificationService";
export async function PATCH(request,{params}){try{const user=await requireProductUser(["ADMIN"]);requireProductOrigin(request);return NextResponse.json(await verifyFarmer(user,(await params).id,await readCommerceRequest(request)));}catch(e){return productErrorResponse(e);}}
