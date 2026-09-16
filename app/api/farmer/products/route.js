import { NextResponse } from "next/server";
import { getFarmerProducts } from "@/services/productService";
import { requireProductUser } from "@/lib/productPermissions";
import { productErrorResponse } from "@/lib/productResponses";
export async function GET(request) {
  try {
    return NextResponse.json(
      await getFarmerProducts(
        await requireProductUser(),
        new URL(request.url).searchParams.get("page") || 1,
      ),
    );
  } catch (error) {
    return productErrorResponse(error);
  }
}
