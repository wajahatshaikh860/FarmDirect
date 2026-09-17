import { NextResponse } from "next/server";
import { requireProductUser } from "@/lib/productPermissions";
import { productErrorResponse } from "@/lib/productResponses";
import { getOrder } from "@/services/orderService";
export async function GET(_request, { params }) {
  try {
    return NextResponse.json(
      await getOrder(await requireProductUser(["BUYER"]), (await params).id),
    );
  } catch (e) {
    return productErrorResponse(e);
  }
}
