import FarmMap from "@/components/phase4/FarmMap";
import { ProductReviews, FarmerRating } from "@/components/phase4/Reviews";
import StarRating from "@/components/phase4/StarRating";
import WishlistButton from "@/components/wishlist/WishlistButton";
import { ratingSummary } from "@/services/reviewService";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getProductById } from "@/services/productService";
import { ProductError } from "@/lib/productErrors";
import {
  formatCurrency,
  unitLabel,
  productLocation,
  displayFarmingType,
} from "@/lib/productUtils";
import ProductPageShell from "@/components/product/ProductPageShell";
import ProductGallery from "@/components/product/ProductGallery";
import Button from "@/components/ui/Button";
import AddToCart from "@/components/cart/AddToCart";
import { ShieldCheck } from "lucide-react";
export const metadata = { title: "Product Details" };
export default async function ProductDetails({ params }) {
  const session = await getServerSession(authOptions);
  let product;
  try {
    product = await getProductById((await params).id, session?.user);
  } catch (error) {
    if (error instanceof ProductError && error.status === 404) notFound();
    throw error;
  }
  const farmer = product.farmer;
  const productRating = await ratingSummary("product", product._id);
  const manages =
    session?.user &&
    (session.user.role === "ADMIN" ||
      (session.user.role === "FARMER" && session.user.id === farmer?._id));
  return (
    <ProductPageShell>
      <Button href="/marketplace" variant="secondary" className="small">
        ← Marketplace
      </Button>
      <div className="product-detail-layout">
        <ProductGallery images={product.images} name={product.name} />
        <div className="product-details">
          <span className="eyebrow">{product.category}</span>
          <h1>{product.name}</h1>
          <p className="product-price">
            {formatCurrency(product.price)}
            <small>/{unitLabel(product.unit)}</small>
          </p>
          <span
            className={
              "product-badge " +
              (product.status === "ACTIVE" ? "" : "product-badge-muted")
            }
          >
            {product.status === "ACTIVE"
              ? "In stock"
              : product.status === "DISABLED"
                ? "Hidden listing"
                : "Out of stock"}
          </span>
          <div className="product-rating-summary"><StarRating value={productRating.average} /><span>{productRating.average.toFixed(1)} ({productRating.count} {productRating.count === 1 ? "Review" : "Reviews"})</span></div>
          <dl className="product-facts">
            <div className="product-description-fact">
              <dt>Description</dt>
              <dd>{product.description}</dd>
            </div>
            <div>
              <dt>Available quantity</dt>
              <dd>
                {product.availableQuantity} {unitLabel(product.unit)}
              </dd>
            </div>
            <div>
              <dt>Minimum order quantity</dt>
              <dd>
                {product.minimumOrderQuantity} {unitLabel(product.unit)}
              </dd>
            </div>
            <div>
              <dt>Quality grade</dt>
              <dd>{product.qualityGrade}</dd>
            </div>
            <div>
              <dt>Farming type</dt>
              <dd>{displayFarmingType(product.farmingType)}</dd>
            </div>
            <div>
              <dt>Harvest date</dt>
              <dd>
                {product.harvestDate
                  ? new Date(product.harvestDate).toLocaleDateString("en-IN", {
                      timeZone: "UTC",
                    })
                  : "Not specified"}
              </dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{productLocation(product.location)}</dd>
            </div>
            <div>
              <dt>Listed on</dt>
              <dd>
                {new Date(product.createdAt).toLocaleDateString("en-IN", {
                  timeZone: "UTC",
                })}
              </dd>
            </div>
          </dl>
          <div className="product-farmer-panel">
            <span className="eyebrow">MEET THE GROWER</span>
            <h2>{farmer?.name || "Farmer information unavailable"}</h2>
            {farmer?.farmerProfile?.farmName && (
              <p>{farmer.farmerProfile.farmName}</p>
            )}
            <p className="muted">{productLocation(farmer?.address)}</p>
            {farmer?.verificationStatus === "VERIFIED" && (
              <span className="product-badge">
                <ShieldCheck size={15} /> Verified farmer
              </span>
            )}
            {farmer?._id && <FarmerRating id={farmer._id} />}
          </div>
          <div className="product-purchase-actions"><AddToCart product={product} role={session?.user?.role} /><WishlistButton productId={product._id} /></div>
          {manages && (
            <Button
              href={"/farmer/products/" + product._id + "/edit"}
              variant="secondary"
            >
              Edit Product
            </Button>
          )}
        </div>
      </div>
      <ProductReviews product={product} user={session?.user} />
      <FarmMap location={{...product.location, addressLine: undefined, postalCode: undefined, latitude: typeof product.location?.latitude === "number" ? Math.round(product.location.latitude*100)/100 : null, longitude: typeof product.location?.longitude === "number" ? Math.round(product.location.longitude*100)/100 : null}} approximate />
    </ProductPageShell>
  );
}
