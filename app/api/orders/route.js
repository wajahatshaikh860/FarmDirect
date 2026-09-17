import { NextResponse } from "next/server";
import { requireProductUser } from "@/lib/productPermissions";
import { productErrorResponse } from "@/lib/productResponses";
import { requireProductOrigin } from "@/lib/productRequest";
import { readCommerceRequest } from "@/lib/commerceRequest";
import { getOrders, placeCodOrder } from "@/services/orderService";
export async function GET(request) {
  try {
    return NextResponse.json(
      await getOrders(
        await requireProductUser(["BUYER"]),
        "BUYER",
        new URL(request.url).searchParams.get("page"),
      ),
    );
  } catch (e) {
    return productErrorResponse(e);
  }
}
export async function POST(request) {
  try {
    const user = await requireProductUser(["BUYER"]);
    requireProductOrigin(request);
    return NextResponse.json(
      await placeCodOrder(user, await readCommerceRequest(request)),
      { status: 201 },
    );
  } catch (e) {
    return productErrorResponse(e);
  }
}
