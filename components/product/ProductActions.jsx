"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
export default function ProductActions({ product }) {
  const [busy, setBusy] = useState(false),
    router = useRouter();
  async function mutate(method, fields) {
    setBusy(true);
    try {
      const response = await fetch("/api/products/" + product._id, {
        method,
        ...(fields
          ? {
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(fields),
            }
          : {}),
      });
      const result = await response.json();
      if (!response.ok) {
        toast.error(result.message || "Something went wrong");
        return;
      }
      toast.success(
        method === "DELETE"
          ? "Product deleted successfully"
          : "Product updated successfully",
      );
      if (result.cleanupFailed)
        toast.warning("Some image cleanup could not be completed.");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  function stock() {
    if (product.availableQuantity > 0) {
      if (window.confirm("Mark " + product.name + " out of stock?"))
        mutate("PATCH", { availableQuantity: 0 });
      return;
    }
    const input = window.prompt(
      "Restock quantity (minimum " + product.minimumOrderQuantity + "):",
      String(product.minimumOrderQuantity),
    );
    if (input === null) return;
    const quantity = Number(input);
    if (
      !Number.isFinite(quantity) ||
      quantity < product.minimumOrderQuantity ||
      quantity <= 0
    ) {
      toast.error("Enter stock at least equal to the minimum order quantity");
      return;
    }
    mutate("PATCH", { availableQuantity: quantity });
  }
  return (
    <>
      <Button
        href={"/products/" + product._id}
        variant="secondary"
        className="small"
      >
        View
      </Button>
      <Button
        href={"/farmer/products/" + product._id + "/edit"}
        variant="secondary"
        className="small"
      >
        Edit
      </Button>
      <Button
        type="button"
        variant="secondary"
        className="small"
        disabled={busy}
        onClick={stock}
      >
        {product.availableQuantity > 0 ? "Mark Out of Stock" : "Restock"}
      </Button>
      <Button
        type="button"
        variant="danger"
        className="small"
        disabled={busy}
        onClick={() => {
          if (
            window.confirm(
              "Delete " + product.name + "? This cannot be undone.",
            )
          )
            mutate("DELETE");
        }}
      >
        Delete
      </Button>
    </>
  );
}
