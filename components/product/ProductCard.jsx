import Link from "next/link";
import Button from "@/components/ui/Button";
import ProductImage from "./ProductImage";
import {
  formatCurrency,
  unitLabel,
  displayFarmingType,
  productLocation,
} from "@/lib/productUtils";
export default function ProductCard({ product, children }) {
  return (
    <article className="product-card">
      <Link
        href={"/products/" + product._id}
        aria-label={"View " + product.name}
      >
        <ProductImage src={product.images?.[0]?.url} alt={product.name} />
      </Link>
      <div className="product-card-body">
        <div className="product-card-meta">
          <span className="eyebrow">{product.category}</span>
          <span
            className={
              "product-badge " +
              (product.status === "ACTIVE" ? "" : "product-badge-muted")
            }
          >
            {product.status === "ACTIVE"
              ? "In stock"
              : product.status === "DISABLED"
                ? "Hidden"
                : "Out of stock"}
          </span>
        </div>
        <h2>
          <Link href={"/products/" + product._id}>{product.name}</Link>
        </h2>
        <p className="product-price">
          {formatCurrency(product.price)}
          <small>/{unitLabel(product.unit)}</small>
        </p>
        <p className="muted">
          {product.availableQuantity} {unitLabel(product.unit)} available
        </p>
        <p className="product-farmer">
          {product.farmer?.name || "Farmer"}
          <span>
            {productLocation({
              district: product.location?.district,
              state: product.location?.state,
            }) || "Location not specified"}
          </span>
        </p>
        <span className="product-badge">
          {displayFarmingType(product.farmingType)}
        </span>
        <div className="product-card-actions">
          {children || (
            <Button
              href={"/products/" + product._id}
              variant="secondary"
              className="small"
            >
              View Product →
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
