import { requireRole } from "@/lib/permissions";
import { getFarmerProducts } from "@/services/productService";
import ProductPageShell from "@/components/product/ProductPageShell";
import ProductCard from "@/components/product/ProductCard";
import ProductActions from "@/components/product/ProductActions";
import ProductEmptyState from "@/components/product/ProductEmptyState";
import ProductPagination from "@/components/product/ProductPagination";
import Button from "@/components/ui/Button";
export const metadata = { title: "My Products" };
export default async function MyProducts({ searchParams }) {
  const user = await requireRole("FARMER");
  const result = await getFarmerProducts(user, (await searchParams).page || 1);
  return (
    <ProductPageShell workspace>
      <header className="product-page-header">
        <div>
          <span className="eyebrow">YOUR FARM. YOUR PRODUCE.</span>
          <h1>My Products</h1>
          <p className="muted">{result.total} listings from your farm</p>
        </div>
        <Button href="/farmer/products/new">Add Product +</Button>
      </header>
      {result.products.length ? (
        <div className="product-grid farmer-product-grid">
          {result.products.map((product) => (
            <ProductCard key={product._id} product={product}>
              <ProductActions product={product} />
            </ProductCard>
          ))}
        </div>
      ) : (
        <ProductEmptyState
          title="You haven't listed any produce yet."
          description="Share what you grow with your community."
          href="/farmer/products/new"
          label="Add Your First Product"
        />
      )}
      <ProductPagination
        page={result.page}
        pages={result.pages}
        base="/farmer/products"
      />
    </ProductPageShell>
  );
}
