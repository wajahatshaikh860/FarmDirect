import { NextResponse } from "next/server";
import { requireProductUser } from "@/lib/productPermissions";
import { ProductError } from "@/lib/productErrors";
import { productErrorResponse } from "@/lib/productResponses";
import { requireProductOrigin } from "@/lib/productRequest";
import { readCommerceRequest } from "@/lib/commerceRequest";
import { updateOrderStatus } from "@/services/orderService";
export async function PATCH(request, { params }) {
  try {
    const user = await requireProductUser(["FARMER"]);
    requireProductOrigin(request);
    return NextResponse.json(
      await updateOrderStatus(
        user,
        (await params).id,
        await readCommerceRequest(request),
      ),
    );
  } catch (e) {
    if (e instanceof ProductError || e?.name === "VersionError")
      return productErrorResponse(e);
    console.error("Farmer order status error:", e?.name || "UnknownError");
    return NextResponse.json(
      { success: false, error: "Unable to update order status" },
      { status: 500 },
    );
  }
}
