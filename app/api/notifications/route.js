import {NextResponse} from "next/server";
import {requireProductUser} from "@/lib/productPermissions";
import {productErrorResponse} from "@/lib/productResponses";
import {requireProductOrigin} from "@/lib/productRequest";
import {getNotifications,readNotifications} from "@/services/notificationService";
export async function GET(){try{return NextResponse.json(await getNotifications(await requireProductUser(["BUYER","FARMER","ADMIN"])));}catch(e){return productErrorResponse(e);}}
export async function PATCH(request){try{const user=await requireProductUser(["BUYER","FARMER","ADMIN"]);requireProductOrigin(request);return NextResponse.json(await readNotifications(user));}catch(e){return productErrorResponse(e);}}
