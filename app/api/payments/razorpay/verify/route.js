import { NextResponse } from "next/server";
import { requireProductUser } from "@/lib/productPermissions";
import { productErrorResponse } from "@/lib/productResponses";
import { requireProductOrigin } from "@/lib/productRequest";
import { readCommerceRequest } from "@/lib/commerceRequest";
import { verifyTestPayment } from "@/services/paymentService";
export async function POST(request) {
  try {
    const user = await requireProductUser(["BUYER"]);
    requireProductOrigin(request);
    return NextResponse.json(
      await verifyTestPayment(user, await readCommerceRequest(request)),
    );
  } catch (e) {
    return productErrorResponse(e);
  }
}
