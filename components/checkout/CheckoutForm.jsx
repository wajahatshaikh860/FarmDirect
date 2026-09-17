"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { formatCurrency } from "@/lib/productUtils";
import RazorpayCheckout from "./RazorpayCheckout";
const fields = [
  ["fullName", "Full name"],
  ["phone", "Phone"],
  ["addressLine1", "Address line 1"],
  ["addressLine2", "Address line 2 (optional)"],
  ["villageOrCity", "Village / City"],
  ["district", "District"],
  ["state", "State"],
  ["postalCode", "Postal code"],
];
async function post(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  return data;
}
export default function CheckoutForm({ cart, user, razorpayAvailable }) {
  const router = useRouter();
  const form = useRef(null);
  const locked = useRef(false);
  const requestId = useRef(null);
  const [method, setMethod] = useState("COD");
  const [busy, setBusy] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(null);
  async function checkout(open) {
    if (locked.current || !form.current.reportValidity()) return;
    locked.current = true;
    setBusy(true);
    requestId.current ||= crypto.randomUUID();
    const shippingAddress = Object.fromEntries(new FormData(form.current));
    delete shippingAddress.paymentMethod;
    const input = {
      shippingAddress,
      paymentMethod: method,
      requestId: requestId.current,
    };
    let paymentReceived = !!pendingVerification;
    try {
      let result;
      if (pendingVerification)
        result = await post(
          "/api/payments/razorpay/verify",
          pendingVerification,
        );
      else if (method === "COD") result = await post("/api/orders", input);
      else {
        const remote = await post("/api/payments/razorpay/create-order", input);
        const callback = await open({
          key: remote.keyId,
          order_id: remote.orderId,
          amount: remote.amount,
          currency: remote.currency,
          prefill: {
            name: shippingAddress.fullName,
            email: user.email,
            contact: shippingAddress.phone,
          },
        });
        paymentReceived = true;
        setPendingVerification(callback);
        result = await post("/api/payments/razorpay/verify", callback);
      }
      toast.success(
        method === "COD" ? "Order placed successfully" : "Payment successful",
      );
      router.push(
        result.orderIds.length === 1
          ? "/buyer/orders/" + result.orderIds[0]
          : "/buyer/orders",
      );
      router.refresh();
    } catch (e) {
      toast.error(e.message || "Checkout failed. Please retry.");
      if (method === "RAZORPAY" && !paymentReceived) requestId.current = null;
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="commerce-layout">
      <form
        ref={form}
        onSubmit={(event) => {
          event.preventDefault();
          if (method === "COD" || pendingVerification) checkout();
        }}
        className="commerce-panel"
      >
        <h2>Delivery address</h2>
        <div className="commerce-address">
          {fields.map(([name, label]) => (
            <div
              className={name.startsWith("addressLine") ? "wide" : ""}
              key={name}
            >
              <Input
                name={name}
                label={label}
                defaultValue={name === "fullName" ? user.name : ""}
                required={name !== "addressLine2"}
                maxLength={name.startsWith("addressLine") ? 200 : 100}
                pattern={
                  name === "phone"
                    ? "[6-9][0-9]{9}"
                    : name === "postalCode"
                      ? "[1-9][0-9]{5}"
                      : undefined
                }
                inputMode={
                  name === "phone" || name === "postalCode"
                    ? "numeric"
                    : undefined
                }
                disabled={busy || !!pendingVerification}
              />
            </div>
          ))}
        </div>
        <fieldset
          className="commerce-payment"
          disabled={busy || !!pendingVerification}
        >
          <legend>Payment method</legend>
          <label>
            <input
              type="radio"
              name="paymentMethod"
              value="COD"
              checked={method === "COD"}
              onChange={() => {
                setMethod("COD");
                requestId.current = null;
              }}
            />
            <span>
              Cash on Delivery<small>Pay when your order is delivered.</small>
            </span>
          </label>
          <label>
            <input
              type="radio"
              name="paymentMethod"
              value="RAZORPAY"
              checked={method === "RAZORPAY"}
              onChange={() => {
                setMethod("RAZORPAY");
                requestId.current = null;
              }}
              disabled={!razorpayAvailable}
            />
            <span>
              Razorpay Online Payment
              <small>
                {razorpayAvailable
                  ? "Demo transaction. No real money."
                  : "Currently unavailable"}
              </small>
            </span>
          </label>
        </fieldset>
        {pendingVerification ? (
          <>
            <p className="commerce-note">
              Payment response received. Retry verification without making
              another payment.
            </p>
            <Button disabled={busy} type="submit">
              {busy ? "Verifying…" : "Retry payment verification"}
            </Button>
          </>
        ) : method === "COD" ? (
          <Button type="submit" disabled={busy || !cart.canCheckout}>
            {busy ? "Placing order…" : "Place COD Order"}
          </Button>
        ) : (
          <RazorpayCheckout
            busy={busy}
            disabled={!cart.canCheckout}
            onPay={checkout}
          />
        )}
      </form>
      <aside className="commerce-panel commerce-summary">
        <h2>Order summary</h2>
        {cart.items.map((item) => (
          <div className="commerce-row" key={item.productId}>
            <span>
              {item.product.name}
              <small className="muted">
                {" "}
                · {item.product.farmer?.name} · {item.quantity}{" "}
                {item.product.unit.toLowerCase()}
              </small>
            </span>
            <strong>{formatCurrency(item.lineTotal)}</strong>
          </div>
        ))}
        <div className="commerce-row commerce-total">
          <span>Total</span>
          <strong>{formatCurrency(cart.subtotal)}</strong>
        </div>
        <p className="commerce-note">
          One order per farmer. No delivery fee is charged in this demo. Prices and stock are confirmed before placing your order.
        </p>
        <Button href="/cart" variant="secondary">
          Back to Cart
        </Button>
      </aside>
    </div>
  );
}
