import ProductPageShell from "@/components/product/ProductPageShell";
import ProductCard from "@/components/product/ProductCard";
import ProductFilters from "@/components/product/ProductFilters";
import ProductSearch from "@/components/product/ProductSearch";
import ProductSort from "@/components/product/ProductSort";
import ProductEmptyState from "@/components/product/ProductEmptyState";
import ProductPagination from "@/components/product/ProductPagination";
import { getProducts } from "@/services/productService";
import { ProductError } from "@/lib/productErrors";
export const metadata = { title: "Marketplace" };
export const dynamic = "force-dynamic";
export default async function Marketplace({ searchParams }) {
  const input = await searchParams;
  let result;
  try {
    result = await getProducts(input);
  } catch (error) {
    if (!(error instanceof ProductError)) throw error;
    return (
      <ProductPageShell>
        <h1>Marketplace</h1>
        <ProductEmptyState
          title="Check your search or filters."
          description={error.message}
          href="/marketplace"
          label="Reset filters"
        />
      </ProductPageShell>
    );
  }
  return (
    <ProductPageShell>
      <header className="product-page-header">
        <div>
          <span className="eyebrow">FRESH FROM THE SOURCE</span>
          <h1>Marketplace</h1>
          <p className="muted">Good produce. Direct connections.</p>
        </div>
      </header>
      <ProductSearch filters={result.filters} />
      <div className="marketplace-layout">
        <ProductFilters filters={result.filters} />
        <div className="marketplace-results">
          <div className="product-results-bar">
            <p>
              {result.total} {result.total === 1 ? "product" : "products"} found
            </p>
            <ProductSort filters={result.filters} />
          </div>
          {result.products.length ? (
            <div className="product-grid">
              {result.products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <ProductEmptyState />
          )}
          <ProductPagination
            page={result.page}
            pages={result.pages}
            filters={result.filters}
            base="/marketplace"
          />
        </div>
      </div>
    </ProductPageShell>
  );
}
