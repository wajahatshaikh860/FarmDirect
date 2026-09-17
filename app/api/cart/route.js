import { NextResponse } from "next/server";
import { requireProductUser } from "@/lib/productPermissions";
import { productErrorResponse } from "@/lib/productResponses";
import { requireProductOrigin } from "@/lib/productRequest";
import { getCart, clearCart } from "@/services/cartService";
export async function GET() {
  try {
    return NextResponse.json(
      await getCart(await requireProductUser(["BUYER"])),
    );
  } catch (e) {
    return productErrorResponse(e);
  }
}
export async function DELETE(request) {
  try {
    const user = await requireProductUser(["BUYER"]);
    requireProductOrigin(request);
    return NextResponse.json(await clearCart(user));
  } catch (e) {
    return productErrorResponse(e);
  }
}
