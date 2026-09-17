import { NextResponse } from "next/server";
import { requireProductUser } from "@/lib/productPermissions";
import { productErrorResponse } from "@/lib/productResponses";
import { requireProductOrigin } from "@/lib/productRequest";
import { readCommerceRequest } from "@/lib/commerceRequest";
import { setCartItem, removeCartItem } from "@/services/cartService";
import { parseCommerce } from "@/lib/commerce";
import { cartQuantitySchema } from "@/validators/cartValidator";
export async function PATCH(request, { params }) {
  try {
    const user = await requireProductUser(["BUYER"]);
    requireProductOrigin(request);
    const values = parseCommerce(
      cartQuantitySchema,
      await readCommerceRequest(request),
    );
    return NextResponse.json(
      await setCartItem(user, {
        productId: (await params).productId,
        quantity: values.quantity,
      }),
    );
  } catch (e) {
    return productErrorResponse(e);
  }
}
export async function DELETE(request, { params }) {
  try {
    const user = await requireProductUser(["BUYER"]);
    requireProductOrigin(request);
    return NextResponse.json(
      await removeCartItem(user, (await params).productId),
    );
  } catch (e) {
    return productErrorResponse(e);
  }
}
