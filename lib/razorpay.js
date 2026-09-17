import Razorpay from "razorpay";
import { createHmac, timingSafeEqual } from "node:crypto";
import { ProductError } from "./productErrors.js";
export function razorpayConfigured() {
  return (
    /^rzp_test_[A-Za-z0-9]+$/.test(process.env.RAZORPAY_KEY_ID || "") &&
    !!process.env.RAZORPAY_KEY_SECRET
  );
}
export function getRazorpay() {
  if (!razorpayConfigured())
    throw new ProductError(
      "Razorpay Test Payment is unavailable. Use Cash on Delivery.",
      503,
    );
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}
export function verifyPaymentSignature(orderId, paymentId, signature, secret) {
  if (
    typeof signature !== "string" ||
    !/^[a-f0-9]{64}$/i.test(signature) ||
    !secret
  )
    return false;
  const expected = createHmac("sha256", secret)
    .update(orderId + "|" + paymentId)
    .digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}
