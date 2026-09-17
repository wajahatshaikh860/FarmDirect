import { NextResponse } from "next/server";
import { requireProductUser } from "@/lib/productPermissions";
import { productErrorResponse } from "@/lib/productResponses";
import { requireProductOrigin } from "@/lib/productRequest";
import { addWishlistProduct, removeWishlistProduct } from "@/services/wishlistService";
export async function POST(request, { params }) {
  try { requireProductOrigin(request); return NextResponse.json(await addWishlistProduct(await requireProductUser(["BUYER"]), (await params).productId)); }
  catch (error) { return productErrorResponse(error); }
}
export async function DELETE(request, { params }) {
  try { requireProductOrigin(request); return NextResponse.json(await removeWishlistProduct(await requireProductUser(["BUYER"]), (await params).productId)); }
  catch (error) { return productErrorResponse(error); }
}
