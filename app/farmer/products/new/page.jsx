import { requireRole } from "@/lib/permissions";
import ProductPageShell from "@/components/product/ProductPageShell";
import ProductForm from "@/components/product/ProductForm";
export const metadata = { title: "Add Product" };
export default async function NewProduct() {
  await requireRole("FARMER");
  return (
    <ProductPageShell workspace activeLabel="Add Product">
      <header className="product-page-header">
        <div>
          <span className="eyebrow">FRESH FROM YOUR FARM</span>
          <h1>Add Product</h1>
          <p className="muted">Tell buyers about your produce.</p>
        </div>
      </header>
      <ProductForm />
    </ProductPageShell>
  );
}
