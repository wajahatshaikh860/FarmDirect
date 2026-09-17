import { NextResponse } from "next/server";
import { requireProductUser } from "@/lib/productPermissions";
import { productErrorResponse } from "@/lib/productResponses";
import { getOrders } from "@/services/orderService";
export async function GET(request) {
  try {
    return NextResponse.json(
      await getOrders(
        await requireProductUser(["FARMER"]),
        "FARMER",
        new URL(request.url).searchParams.get("page"),
      ),
    );
  } catch (e) {
    return productErrorResponse(e);
  }
}
