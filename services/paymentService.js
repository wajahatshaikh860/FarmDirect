import CheckoutAttempt from "../models/CheckoutAttempt.js";
import { connectDB } from "../lib/db.js";
import { commerceTransaction } from "../lib/commerceTransaction.js";
import { ProductError } from "../lib/productErrors.js";
import { requireProductRole } from "../lib/productPermissions.js";
import {
  checkoutSchema,
  paymentVerificationSchema,
} from "../validators/orderValidator.js";
import { parseCommerce } from "../lib/commerce.js";
import { getRazorpay, verifyPaymentSignature } from "../lib/razorpay.js";
import { readCheckoutCart, completeCheckout } from "./orderService.js";
export async function createTestPayment(user, input, gateway) {
  requireProductRole(user, ["BUYER"]);
  gateway ||= getRazorpay();
  const values = parseCommerce(checkoutSchema, input);
  if (values.paymentMethod !== "RAZORPAY")
    throw new ProductError("Choose Razorpay Test Payment", 400);
  const result = await commerceTransaction(async (session) => {
    const existing = await CheckoutAttempt.findOne({
      buyer: user.id,
      requestId: values.requestId,
    }).session(session);
    if (existing) {
      if (existing.paymentMethod === "RAZORPAY" && existing.status === "READY")
        return { attempt: existing, existing: true };
      throw new ProductError(
        "Payment request already used. Start a new test checkout.",
        409,
      );
    }
    const current = await readCheckoutCart(user, session);
    const [attempt] = await CheckoutAttempt.create(
      [
        {
          buyer: user.id,
          requestId: values.requestId,
          paymentMethod: "RAZORPAY",
          status: "CREATING",
          amountPaise: current.amountPaise,
          cartVersion: current.cart.__v,
          items: current.items,
          shippingAddress: values.shippingAddress,
        },
      ],
      { session },
    );
    return { attempt, existing: false };
  });
  const attempt = result.attempt;
  if (!result.existing) {
    try {
      const remote = await gateway.orders.create({
        amount: attempt.amountPaise,
        currency: "INR",
        receipt: String(attempt._id),
        notes: { checkout: String(attempt._id) },
      });
      if (
        !remote.id ||
        Number(remote.amount) !== attempt.amountPaise ||
        remote.currency !== "INR"
      )
        throw new Error("Invalid gateway response");
      attempt.razorpayOrderId = remote.id;
      attempt.status = "READY";
      // Preparation transaction has ended; detach its session before saving the gateway ID.
      attempt.$session(null);
      await attempt.save();
    } catch {
      await CheckoutAttempt.updateOne(
        { _id: attempt._id, status: "CREATING" },
        { $set: { status: "FAILED" } },
      );
      throw new ProductError(
        "Unable to start Razorpay Test Payment. Please retry or use Cash on Delivery.",
        503,
      );
    }
  }
  return {
    keyId: process.env.RAZORPAY_KEY_ID,
    orderId: attempt.razorpayOrderId,
    amount: attempt.amountPaise,
    currency: "INR",
  };
}
export async function verifyTestPayment(user, input, gateway) {
  requireProductRole(user, ["BUYER"]);
  gateway ||= getRazorpay();
  const values = parseCommerce(paymentVerificationSchema, input);
  await connectDB();
  const attempt = await CheckoutAttempt.findOne({
    buyer: user.id,
    razorpayOrderId: values.razorpay_order_id,
    paymentMethod: "RAZORPAY",
  });
  if (!attempt) throw new ProductError("Payment attempt not found", 404);
  // The stored order ID is used for HMAC, never an arbitrary browser value.
  if (
    !verifyPaymentSignature(
      attempt.razorpayOrderId,
      values.razorpay_payment_id,
      values.razorpay_signature,
      process.env.RAZORPAY_KEY_SECRET,
    )
  ) {
    await CheckoutAttempt.updateOne(
      { _id: attempt._id, status: { $ne: "COMPLETED" } },
      { $set: { status: "FAILED" } },
    );
    throw new ProductError("Payment verification failed", 400);
  }
  if (attempt.status === "COMPLETED") {
    if (attempt.razorpayPaymentId !== values.razorpay_payment_id)
      throw new ProductError("Payment already consumed", 409);
    return { orderIds: attempt.orderIds.map(String) };
  }
  let payment;
  try {
    payment = await gateway.payments.fetch(values.razorpay_payment_id);
    if (
      payment.order_id !== attempt.razorpayOrderId ||
      Number(payment.amount) !== attempt.amountPaise ||
      payment.currency !== "INR"
    )
      throw new Error("Payment mismatch");
    if (payment.status === "authorized")
      payment = await gateway.payments.capture(
        payment.id,
        attempt.amountPaise,
        "INR",
      );
    if (payment.status !== "captured") throw new Error("Payment not captured");
  } catch {
    await CheckoutAttempt.updateOne(
      { _id: attempt._id, status: { $ne: "COMPLETED" } },
      { $set: { status: "FAILED" } },
    );
    throw new ProductError(
      "Payment verification failed. Cart and stock remain unchanged.",
      400,
    );
  }
  return commerceTransaction(async (session) => {
    const current = await CheckoutAttempt.findOne({
      _id: attempt._id,
      buyer: user.id,
    }).session(session);
    if (
      current.status === "COMPLETED" &&
      current.razorpayPaymentId !== payment.id
    )
      throw new ProductError("Payment already consumed", 409);
    return {
      orderIds: await completeCheckout(current, user, session, payment),
    };
  });
}
