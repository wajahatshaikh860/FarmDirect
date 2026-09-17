import { notifyNewOrders, notifyOrderStatus } from "./notificationService.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import CheckoutAttempt from "../models/CheckoutAttempt.js";
import "../models/User.js";
import { connectDB } from "../lib/db.js";
import { commerceTransaction } from "../lib/commerceTransaction.js";
import { ProductError } from "../lib/productErrors.js";
import { requireProductRole } from "../lib/productPermissions.js";
import { checkoutSchema, statusSchema } from "../validators/orderValidator.js";
import { objectId } from "../validators/cartValidator.js";
import {
  checkoutSnapshot,
  groupOrders,
  inventoryChange,
  assertOwner,
  assertTransition,
  parseCommerce,
  serializeCommerce,
} from "../lib/commerce.js";
export async function readCheckoutCart(user, session) {
  const cart = await Cart.findOne({ buyer: user.id }).session(session);
  if (!cart || !cart.items.length)
    throw new ProductError("Your cart is empty.", 400);
  const products = await Product.find({
    _id: { $in: cart.items.map((item) => item.product) },
  })
    .populate("farmer", "role accountStatus")
    .session(session);
  const items = checkoutSnapshot(cart.items, products);
  const amountPaise = items.reduce(
    (sum, item) => sum + Math.round(item.lineTotal * 100),
    0,
  );
  if (
    !Number.isSafeInteger(amountPaise) ||
    amountPaise <= 0 ||
    amountPaise > 100000000
  )
    throw new ProductError("Checkout amount exceeds the demo limit", 400);
  return { cart, products, items, amountPaise };
}
export async function applyInventory(
  product,
  quantity,
  session,
  restore = false,
) {
  const fields = inventoryChange(product, quantity, restore);
  // Conditional write also advances Phase 2's optimistic-concurrency version.
  // Residual stock may fall below MOQ; inventory consumption must not alter MOQ.
  const result = await Product.updateOne(
    {
      _id: product._id,
      __v: product.__v,
      availableQuantity: product.availableQuantity,
      ...(restore ? {} : { status: "ACTIVE" }),
    },
    { $set: fields, $inc: { __v: 1 } },
    { session },
  );
  if (result.modifiedCount !== 1)
    throw new ProductError("Stock changed. Refresh and try again.", 409);
}
export async function completeCheckout(attempt, user, session, payment) {
  if (attempt.status === "COMPLETED") return attempt.orderIds.map(String);
  assertOwner(user, attempt, "BUYER");
  const current = await readCheckoutCart(user, session);
  if (
    current.cart.__v !== attempt.cartVersion ||
    JSON.stringify(
      current.items.map((item) => [
        item.product,
        item.quantity,
        item.priceAtOrder,
        item.farmer,
        item.unit,
      ]),
    ) !==
      JSON.stringify(
        attempt.items.map((item) => [
          String(item.product),
          item.quantity,
          item.priceAtOrder,
          String(item.farmer),
          item.unit,
        ]),
      )
  )
    throw new ProductError(
      "Your cart or prices changed. Payment is recorded by Razorpay; no order was fulfilled. Contact support for this test payment.",
      409,
    );
  if (current.amountPaise !== attempt.amountPaise)
    throw new ProductError("Checkout total changed", 409);
  for (const item of attempt.items) {
    const product = current.products.find(
      (p) => String(p._id) === String(item.product),
    );
    await applyInventory(product, item.quantity, session);
  }
  const groups = groupOrders(
    attempt.items.map((item) => ({
      ...item.toObject(),
      product: String(item.product),
      farmer: String(item.farmer),
    })),
  );
  const created = await Order.create(
    groups.map((group) => ({
      ...group,
      buyer: user.id,
      checkout: attempt._id,
      shippingAddress: attempt.shippingAddress,
      paymentMethod: attempt.paymentMethod,
      paymentStatus: payment ? "PAID" : "PENDING",
      orderStatus: "PENDING",
      ...(payment
        ? {
            razorpay: {
              orderId: attempt.razorpayOrderId,
              paymentId: payment.id,
              verifiedAt: new Date(),
            },
          }
        : {}),
      statusHistory: [
        { status: "PENDING", changedAt: new Date(), changedBy: user.id },
      ],
    })),
    { session, ordered: true },
  );
  // A concurrent cart mutation conflicts with this save and retries the entire transaction.
  current.cart.items = [];
  await current.cart.save({ session });
  attempt.status = "COMPLETED";
  attempt.orderIds = created.map((order) => order._id);
  if (payment) {
    attempt.razorpayPaymentId = payment.id;
    attempt.verifiedAt = new Date();
  }
  await attempt.save({ session });
  return created.map((order) => String(order._id));
}
export async function placeCodOrder(user, input) {
  requireProductRole(user, ["BUYER"]);
  const values = parseCommerce(checkoutSchema, input);
  if (values.paymentMethod !== "COD")
    throw new ProductError("Use the Razorpay Test Payment flow", 400);
  const result = await commerceTransaction(async (session) => {
    let attempt = await CheckoutAttempt.findOne({
      buyer: user.id,
      requestId: values.requestId,
    }).session(session);
    if (attempt) {
      if (attempt.paymentMethod !== "COD")
        throw new ProductError("Checkout request already used", 409);
      if (attempt.status === "COMPLETED")
        return { orderIds: attempt.orderIds.map(String) };
      throw new ProductError("Checkout is already processing", 409);
    }
    const current = await readCheckoutCart(user, session);
    [attempt] = await CheckoutAttempt.create(
      [
        {
          buyer: user.id,
          requestId: values.requestId,
          paymentMethod: "COD",
          status: "READY",
          amountPaise: current.amountPaise,
          cartVersion: current.cart.__v,
          items: current.items,
          shippingAddress: values.shippingAddress,
        },
      ],
      { session },
    );
    return { orderIds: await completeCheckout(attempt, user, session) };
  });
  await notifyNewOrders(result.orderIds);
  return result;
}
export async function getOrders(user, role, page = 1) {
  requireProductRole(user, [role]);
  await connectDB();
  page = Math.min(10000, Math.max(1, Number.parseInt(page, 10) || 1));
  const query = { [role === "BUYER" ? "buyer" : "farmer"]: user.id };
  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate(role === "BUYER" ? "farmer" : "buyer", "name")
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * 20)
      .limit(20)
      .lean(),
    Order.countDocuments(query),
  ]);
  return {
    orders: serializeCommerce(orders),
    page,
    pages: Math.ceil(total / 20),
    total,
  };
}
export async function getOrder(user, id, role = "BUYER") {
  requireProductRole(user, [role]);
  parseCommerce(objectId, id);
  await connectDB();
  const order = await Order.findById(id)
    .populate("farmer buyer", "name")
    .lean();
  if (!order) throw new ProductError("Order not found", 404);
  assertOwner(user, order, role);
  return serializeCommerce(order);
}
export async function updateOrderStatus(user, id, input) {
  requireProductRole(user, ["FARMER"]);
  parseCommerce(objectId, id);
  const { status } = parseCommerce(statusSchema, input);
  const result = await commerceTransaction(async (session) => {
    const order = await Order.findById(id).session(session);
    if (!order) throw new ProductError("Order not found", 404);
    assertOwner(user, order, "FARMER");
    assertTransition(order.orderStatus, status);
    if (status === "CANCELLED") {
      if (order.inventoryRestored)
        throw new ProductError("Inventory already restored", 409);
      for (const item of order.items) {
        const product = await Product.findById(item.product).session(session);
        // Phase 2 permits deletion; historical orders remain readable without resurrecting listings.
        if (product)
          await applyInventory(product, item.quantity, session, true);
      }
      order.inventoryRestored = true;
    }
    order.orderStatus = status;
    if (status === "DELIVERED" && order.paymentMethod === "COD")
      order.paymentStatus = "PAID";
    order.statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy: user.id,
    });
    await order.save({ session });
    return serializeCommerce(order);
  });
  await notifyOrderStatus(result);
  return result;
}
