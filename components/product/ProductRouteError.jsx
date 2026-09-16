"use client";
import ProductPageShell from "./ProductPageShell";
import Button from "@/components/ui/Button";
export default function ProductRouteError({ reset }) {
  return (
    <ProductPageShell>
      <div className="empty-state product-empty">
        <h1>We couldn’t load this page.</h1>
        <p>Please try again in a moment.</p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </ProductPageShell>
  );
}
