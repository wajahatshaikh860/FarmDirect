import { redirect, notFound } from "next/navigation";
import { requireAuth } from "@/lib/permissions";
import { dashboardFor } from "@/lib/constants";
import {
  getProductForManagement,
  serializeProduct,
} from "@/services/productService";
import { ProductError } from "@/lib/productErrors";
import ProductPageShell from "@/components/product/ProductPageShell";
import ProductForm from "@/components/product/ProductForm";
import ProductEmptyState from "@/components/product/ProductEmptyState";
export const metadata = { title: "Edit Product" };
export default async function EditProduct({ params }) {
  const user = await requireAuth();
  if (!["FARMER", "ADMIN"].includes(user.role))
    redirect(dashboardFor(user.role) + "?error=unauthorized");
  let product;
  try {
    product = serializeProduct(
      await getProductForManagement((await params).id, user),
    );
  } catch (error) {
    if (!(error instanceof ProductError)) throw error;
    if (error.status === 404) notFound();
    return (
      <ProductPageShell>
        <ProductEmptyState
          title="Access denied"
          description="You do not have permission to edit this product."
          href={dashboardFor(user.role)}
          label="Back to dashboard"
        />
      </ProductPageShell>
    );
  }
  return (
    <ProductPageShell workspace={user.role === "FARMER"}>
      <header className="product-page-header">
        <div>
          <span className="eyebrow">KEEP YOUR LISTING FRESH</span>
          <h1>Edit Product</h1>
        </div>
      </header>
      <ProductForm
        product={product}
        returnTo={
          user.role === "ADMIN"
            ? "/products/" + product._id
            : "/farmer/products"
        }
      />
    </ProductPageShell>
  );
}
