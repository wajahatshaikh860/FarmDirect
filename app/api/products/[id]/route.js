import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getProductById,
  updateProduct,
  deleteProduct,
} from "@/services/productService";
import { requireProductUser } from "@/lib/productPermissions";
import { requireProductOrigin, readProductRequest } from "@/lib/productRequest";
import { productErrorResponse } from "@/lib/productResponses";
export const runtime = "nodejs";
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    return NextResponse.json({
      product: await getProductById((await params).id, session?.user),
    });
  } catch (error) {
    return productErrorResponse(error);
  }
}
export async function PATCH(request, { params }) {
  try {
    const user = await requireProductUser(["FARMER", "ADMIN"]);
    requireProductOrigin(request);
    const { fields, files, retainedImages } = await readProductRequest(request);
    const result = await updateProduct(
      (await params).id,
      user,
      fields,
      files,
      retainedImages,
    );
    return NextResponse.json({
      message: "Product updated successfully",
      ...result,
    });
  } catch (error) {
    return productErrorResponse(error);
  }
}
export async function DELETE(request, { params }) {
  try {
    const user = await requireProductUser(["FARMER", "ADMIN"]);
    requireProductOrigin(request);
    return NextResponse.json({
      message: "Product deleted successfully",
      ...(await deleteProduct((await params).id, user)),
    });
  } catch (error) {
    return productErrorResponse(error);
  }
}
