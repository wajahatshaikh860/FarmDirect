import ProductPageShell from "./ProductPageShell";
export default function ProductLoading() {
  return (
    <ProductPageShell>
      <div role="status" aria-label="Loading products">
        <span className="sr-only">Loading products…</span>
        <div className="product-grid">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <div className="product-skeleton" key={index}>
              <div />
              <span />
              <span />
              <span />
            </div>
          ))}
        </div>
      </div>
    </ProductPageShell>
  );
}
