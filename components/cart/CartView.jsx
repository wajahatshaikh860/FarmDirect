"use client";
import { useRef, useState } from "react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ProductImage from "@/components/product/ProductImage";
import { formatCurrency, unitLabel } from "@/lib/productUtils";
function CartItem({ item, mutate, busy }) {
  const [quantity, setQuantity] = useState(item.quantity);
  const product = item.product;
  const minimum = product?.minimumOrderQuantity || 0.001;
  return (
    <article className="commerce-item">
      <div className="commerce-item-image">
        <ProductImage
          src={product?.images?.[0]?.url}
          alt={product?.name || "Deleted product"}
        />
      </div>
      <div>
        <h2>{product?.name || "Product no longer available"}</h2>
        {product && (
          <>
            <p className="muted">
              {product.farmer?.name || "Farmer unavailable"} ·{" "}
              {formatCurrency(product.price)}/{unitLabel(product.unit)}
            </p>
            <p className="commerce-note">
              Minimum {minimum}; available stock {product.availableQuantity}{" "}
              {unitLabel(product.unit)}
            </p>
          </>
        )}
        {item.error && (
          <p className="commerce-error" role="alert">
            {item.error}
          </p>
        )}
        <strong>{formatCurrency(item.lineTotal)}</strong>
        <div className="commerce-quantity">
          <Button
            type="button"
            variant="secondary"
            aria-label={"Decrease " + (product?.name || "quantity")}
            disabled={busy || !!item.error || item.quantity <= minimum}
            onClick={() =>
              mutate(
                item.productId,
                "PATCH",
                Math.max(minimum, item.quantity - 1),
              )
            }
          >
            −
          </Button>
          <Input
            name={"quantity-" + item.productId}
            label="Quantity"
            type="number"
            min={minimum}
            max={product?.availableQuantity}
            step="0.001"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            disabled={busy}
          />
          <Button
            type="button"
            variant="secondary"
            aria-label={"Increase " + (product?.name || "quantity")}
            disabled={
              busy ||
              !!item.error ||
              item.quantity >= product?.availableQuantity
            }
            onClick={() =>
              mutate(
                item.productId,
                "PATCH",
                Math.min(product.availableQuantity, item.quantity + 1),
              )
            }
          >
            +
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy || !product}
            onClick={() => mutate(item.productId, "PATCH", Number(quantity))}
          >
            Update
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={busy}
            onClick={() => mutate(item.productId, "DELETE")}
          >
            Remove
          </Button>
        </div>
      </div>
    </article>
  );
}
export default function CartView({ initialCart }) {
  const [cart, setCart] = useState(initialCart);
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  async function mutate(id, method, quantity) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    try {
      const response = await fetch(id ? "/api/cart/items/" + id : "/api/cart", {
        method,
        headers: { "Content-Type": "application/json" },
        ...(method === "PATCH" ? { body: JSON.stringify({ quantity }) } : {}),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setCart(data);
      toast.success(method === "DELETE" ? "Item removed" : "Cart updated");
    } catch (e) {
      toast.error(e.message || "Unable to update cart");
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  if (!cart.items.length)
    return (
      <div className="commerce-panel commerce-empty">
        <h2>Your cart is empty.</h2>
        <p className="muted">Find fresh produce directly from farmers.</p>
        <Button href="/marketplace">Browse Marketplace</Button>
      </div>
    );
  return (
    <div className="commerce-layout">
      <div className="commerce-panel">
        {cart.items.map((item) => (
          <CartItem
            key={item.productId + ":" + item.quantity}
            item={item}
            busy={busy}
            mutate={mutate}
          />
        ))}
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => mutate(null, "DELETE")}
        >
          Clear cart
        </Button>
      </div>
      <aside className="commerce-panel commerce-summary">
        <h2>Cart summary</h2>
        <div className="commerce-row commerce-total">
          <span>Subtotal</span>
          <strong>{formatCurrency(cart.subtotal)}</strong>
        </div>
        <p className="commerce-note">
          Prices and stock will be checked again at checkout.
        </p>
        {cart.canCheckout ? (
          <Button href="/checkout">Proceed to Checkout</Button>
        ) : (
          <p className="commerce-error">
            Update or remove unavailable items before checkout.
          </p>
        )}
        <div className="commerce-actions">
          <Button href="/marketplace" variant="secondary">
            Continue shopping
          </Button>
        </div>
      </aside>
    </div>
  );
}
