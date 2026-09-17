import { requireRole } from "@/lib/permissions";
import { getWishlist } from "@/services/wishlistService";
import ProductPageShell from "@/components/product/ProductPageShell";
import ProductCard from "@/components/product/ProductCard";
import Button from "@/components/ui/Button";
export const metadata = { title: "Wishlist" };
export default async function WishlistPage() {
  const user = await requireRole("BUYER");
  const { products } = await getWishlist(user);
  return <ProductPageShell><header className="product-page-header"><div><span className="eyebrow">SAVED PRODUCE</span><h1>Your Wishlist</h1><p className="muted">Products you want to come back to.</p></div></header>{products.length ? <div className="product-grid">{products.map(product => <ProductCard key={product._id} product={product} isWishlisted />)}</div> : <section className="product-empty empty-state"><h2>Your wishlist is empty.</h2><p>Save produce from the marketplace to find it here later.</p><Button href="/marketplace">Browse Marketplace</Button></section>}</ProductPageShell>;
}
