import {NextResponse} from "next/server";
import {requireProductUser} from "@/lib/productPermissions";
import {productErrorResponse} from "@/lib/productResponses";
import {requireProductOrigin} from "@/lib/productRequest";
import {readNotifications} from "@/services/notificationService";
export async function PATCH(request,{params}){try{const user=await requireProductUser(["BUYER","FARMER","ADMIN"]);requireProductOrigin(request);return NextResponse.json(await readNotifications(user,(await params).id));}catch(e){return productErrorResponse(e);}}
