import {NextResponse} from "next/server";
import {requireProductUser} from "@/lib/productPermissions";
import {productErrorResponse} from "@/lib/productResponses";
import {requireProductOrigin} from "@/lib/productRequest";
import {readCommerceRequest} from "@/lib/commerceRequest";
import {createReview} from "@/services/reviewService";
export async function POST(request){try{const user=await requireProductUser(["BUYER"]);requireProductOrigin(request);return NextResponse.json(await createReview(user,await readCommerceRequest(request)),{status:201});}catch(e){return productErrorResponse(e);}}
