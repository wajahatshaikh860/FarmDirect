import {NextResponse} from "next/server";
import {requireProductUser} from "@/lib/productPermissions";
import {productErrorResponse} from "@/lib/productResponses";
import {requireProductOrigin} from "@/lib/productRequest";
import {readCommerceRequest} from "@/lib/commerceRequest";
import {changeReview} from "@/services/reviewService";
export async function PATCH(request,{params}){try{const user=await requireProductUser(["BUYER"]);requireProductOrigin(request);return NextResponse.json(await changeReview(user,(await params).id,await readCommerceRequest(request)));}catch(e){return productErrorResponse(e);}}
export async function DELETE(request,{params}){try{const user=await requireProductUser(["BUYER"]);requireProductOrigin(request);return NextResponse.json(await changeReview(user,(await params).id,null,true));}catch(e){return productErrorResponse(e);}}
