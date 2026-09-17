"use client";
import Script from "next/script";
import { useState } from "react";
import Button from "@/components/ui/Button";
export default function RazorpayCheckout({ disabled, busy, onPay }) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  function open(options) {
    return new Promise((resolve, reject) => {
      if (!window.Razorpay) {
        reject(new Error("Unable to load Razorpay Test Checkout"));
        return;
      }
      const checkout = new window.Razorpay({
        ...options,
        name: "FarmDirect",
        description: "Test Payment — no real money",
        handler: resolve,
        modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
      });
      checkout.on("payment.failed", () => {
        checkout.close();
        reject(new Error("Test payment failed. Your cart is unchanged."));
      });
      checkout.open();
    });
  }
  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onReady={() => setReady(true)}
        onError={() => setFailed(true)}
      />
      <Button
        type="submit"
        disabled={disabled || busy || !ready}
        onClick={(event) => {
          event.preventDefault();
          onPay(open);
        }}
      >
        {busy
          ? "Processing test payment…"
          : ready
            ? "Pay with Razorpay Test"
            : "Loading Test Checkout…"}
      </Button>
      {failed && (
        <p className="commerce-error">
          Razorpay could not load. Please use Cash on Delivery.
        </p>
      )}
    </>
  );
}
