"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import { TRANSITIONS } from "@/lib/commerce";
import { readFarmerOrderResponse } from "@/lib/farmerOrderResponse";
const labels = {
  CONFIRMED: "Accept",
  CANCELLED: "Reject",
  PACKED: "Mark Packed",
  SHIPPED: "Mark Shipped",
  DELIVERED: "Mark Delivered",
};
export default function FarmerOrderActions({ order }) {
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const router = useRouter();
  async function update(status) {
    if (
      locked.current ||
      (status === "CANCELLED" &&
        !window.confirm("Reject this order and restore its stock?"))
    )
      return;
    locked.current = true;
    setBusy(true);
    try {
      const response = await fetch(
        "/api/farmer/orders/" + order._id + "/status",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      await readFarmerOrderResponse(response);
      toast.success(
        status === "CONFIRMED"
          ? "Order accepted"
          : status === "CANCELLED"
            ? "Order rejected"
            : "Order status updated",
      );
      router.refresh();
    } catch (e) {
      toast.error(e.message || "Unable to update order");
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="commerce-actions">
      {TRANSITIONS[order.orderStatus].map((status) => (
        <Button
          key={status}
          disabled={busy}
          variant={status === "CANCELLED" ? "danger" : "primary"}
          onClick={() => update(status)}
        >
          {busy ? "Updating…" : labels[status]}
        </Button>
      ))}
    </div>
  );
}
