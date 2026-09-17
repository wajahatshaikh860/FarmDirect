import { NextResponse } from "next/server";
import { requireProductUser } from "@/lib/productPermissions";
import { productErrorResponse } from "@/lib/productResponses";
import { requireProductOrigin } from "@/lib/productRequest";
import { readCommerceRequest } from "@/lib/commerceRequest";
import { setCartItem } from "@/services/cartService";
export async function POST(request) {
  try {
    const user = await requireProductUser(["BUYER"]);
    requireProductOrigin(request);
    return NextResponse.json(
      await setCartItem(user, await readCommerceRequest(request)),
    );
  } catch (e) {
    return productErrorResponse(e);
  }
}
