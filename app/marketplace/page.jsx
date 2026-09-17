import ProductPageShell from "@/components/product/ProductPageShell";
import ProductCard from "@/components/product/ProductCard";
import ProductFilters from "@/components/product/ProductFilters";
import ProductSearch from "@/components/product/ProductSearch";
import ProductSort from "@/components/product/ProductSort";
import ProductEmptyState from "@/components/product/ProductEmptyState";
import ProductPagination from "@/components/product/ProductPagination";
import { getProducts } from "@/services/productService";
import { ProductError } from "@/lib/productErrors";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { wishlistProductIds } from "@/services/wishlistService";
export const metadata = { title: "Marketplace" };
export const dynamic = "force-dynamic";
export default async function Marketplace({ searchParams }) {
  const input = await searchParams;
  let result;
  try { result = await getProducts(input); }
  catch (error) { if (!(error instanceof ProductError)) throw error; return <ProductPageShell fullWidth marketplace><ProductEmptyState title="No products found." description={error.message} href="/marketplace" label="Clear Filters" /></ProductPageShell>; }
  const session = await getServerSession(authOptions);
  const wishlisted = session?.user?.role === "BUYER" ? await wishlistProductIds(session.user) : [];
  return <ProductPageShell fullWidth marketplace><header className="marketplace-toolbar"><div className="marketplace-title"><h1>Marketplace</h1><p className="muted">Good produce. Direct connections.</p></div><div className="marketplace-controls"><ProductSearch filters={result.filters} /><ProductSort filters={result.filters} /><ProductFilters filters={result.filters} /></div></header><div className="product-results-bar"><p>{result.total} {result.total === 1 ? "product" : "products"} found</p></div>{result.products.length ? <div className="product-grid">{result.products.map(product => <ProductCard key={product._id} product={product} isWishlisted={wishlisted.includes(product._id)} />)}</div> : <ProductEmptyState title="No products found." description="Try changing your search or filters." href="/marketplace" label="Clear Filters" />}<ProductPagination page={result.page} pages={result.pages} filters={result.filters} base="/marketplace" /></ProductPageShell>;
}
