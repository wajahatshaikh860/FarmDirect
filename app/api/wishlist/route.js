import { NextResponse } from "next/server";
import { requireProductUser } from "@/lib/productPermissions";
import { productErrorResponse } from "@/lib/productResponses";
import { getWishlist } from "@/services/wishlistService";
export async function GET() {
  try { return NextResponse.json(await getWishlist(await requireProductUser(["BUYER"]))); }
  catch (error) { return productErrorResponse(error); }
}
