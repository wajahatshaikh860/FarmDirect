"use client";
import { useRef, useState } from "react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import "../commerce/commerce.css";
export default function AddToCart({ product, role }) {
  const [quantity, setQuantity] = useState(product.minimumOrderQuantity);
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  if (!role)
    return (
      <div className="commerce-add">
        <Button href="/login">Login to add to cart</Button>
      </div>
    );
  if (role !== "BUYER")
    return (
      <p className="commerce-note">Only Buyers can add produce to a cart.</p>
    );
  async function add(event) {
    event.preventDefault();
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    try {
      const response = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product._id,
          quantity: Number(quantity),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      toast.success("Added to cart");
    } catch (error) {
      toast.error(error.message || "Unable to update cart");
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  const available =
    product.status === "ACTIVE" &&
    product.availableQuantity >= product.minimumOrderQuantity;
  return (
    <form onSubmit={add} className="commerce-add">
      <div className="commerce-quantity">
        <Input
          name="quantity"
          label="Order quantity"
          type="number"
          min={product.minimumOrderQuantity}
          max={product.availableQuantity}
          step="0.001"
          required
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          disabled={!available || busy}
        />
        <Button type="submit" disabled={!available || busy}>
          {busy ? "Adding…" : available ? "Add to Cart" : "Product unavailable"}
        </Button>
        <Button href="/cart" variant="secondary">
          View Cart
        </Button>
      </div>
      <p className="commerce-note">
        Minimum {product.minimumOrderQuantity} {product.unit.toLowerCase()};
        available {product.availableQuantity}. Adding again replaces this
        product’s cart quantity.
      </p>
    </form>
  );
}
