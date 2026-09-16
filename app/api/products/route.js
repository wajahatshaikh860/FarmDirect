import { NextResponse } from "next/server";
import { getProducts, createProduct } from "@/services/productService";
import { requireProductUser } from "@/lib/productPermissions";
import { requireProductOrigin, readProductRequest } from "@/lib/productRequest";
import { productErrorResponse } from "@/lib/productResponses";
export const runtime = "nodejs";
export async function GET(request) {
  try {
    return NextResponse.json(
      await getProducts(Object.fromEntries(new URL(request.url).searchParams)),
    );
  } catch (error) {
    return productErrorResponse(error);
  }
}
export async function POST(request) {
  try {
    const user = await requireProductUser();
    requireProductOrigin(request);
    const { fields, files, retainedImages } = await readProductRequest(request);
    return NextResponse.json(
      {
        message: "Product added successfully",
        product: await createProduct(user, fields, files, retainedImages),
      },
      { status: 201 },
    );
  } catch (error) {
    return productErrorResponse(error);
  }
}
