import { ProductError } from "./productErrors.js";
import { productStatus } from "./productUtils.js";
export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];
export const TRANSITIONS = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PACKED"],
  PACKED: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};
export function assertTransition(current, next) {
  if (!TRANSITIONS[current]?.includes(next))
    throw new ProductError("Invalid order status transition", 409);
}
export function assertOwner(user, order, role) {
  if (!user?.id) throw new ProductError("Unauthorized", 401);
  if (
    user.role !== role ||
    String(
      order[role === "BUYER" ? "buyer" : "farmer"]?._id ||
        order[role === "BUYER" ? "buyer" : "farmer"],
    ) !== String(user.id)
  )
    throw new ProductError("Forbidden", 403);
}
export function assertQuantity(product, quantity) {
  if (!product || product.status !== "ACTIVE" || product.availableQuantity <= 0)
    throw new ProductError("Product unavailable", 409);
  if (
    !Number.isFinite(quantity) ||
    quantity <= 0 ||
    quantity < product.minimumOrderQuantity
  )
    throw new ProductError("Quantity is below the minimum order", 400);
  if (quantity > product.availableQuantity)
    throw new ProductError("Insufficient stock", 409);
}
export function toPaise(price) {
  const amount = Math.round(price * 100);
  if (!Number.isSafeInteger(amount) || amount <= 0)
    throw new ProductError("Invalid product price", 400);
  return amount;
}
export function linePaise(price, quantity) {
  const amount = Math.round(toPaise(price) * quantity);
  if (!Number.isSafeInteger(amount) || amount <= 0)
    throw new ProductError("Invalid order amount", 400);
  return amount;
}
export function checkoutSnapshot(items, products) {
  if (!items.length) throw new ProductError("Your cart is empty.", 400);
  const byId = new Map(products.map((p) => [String(p._id), p]));
  return items.map((item) => {
    const product = byId.get(String(item.product));
    assertQuantity(product, item.quantity);
    if (
      !product.farmer ||
      product.farmer.role !== "FARMER" ||
      product.farmer.accountStatus !== "ACTIVE"
    )
      throw new ProductError("Farmer unavailable", 409);
    return {
      product: String(product._id),
      farmer: String(product.farmer._id),
      productName: product.name,
      productImage: product.images?.[0]?.url || "",
      category: product.category,
      unit: product.unit,
      priceAtOrder: product.price,
      quantity: item.quantity,
      lineTotal: linePaise(product.price, item.quantity) / 100,
    };
  });
}
export function groupOrders(items) {
  const groups = new Map();
  for (const item of items) {
    const group = groups.get(item.farmer) || {
      farmer: item.farmer,
      items: [],
      subtotal: 0,
      totalAmount: 0,
    };
    const snapshot = { ...item };
    delete snapshot.farmer;
    group.items.push(snapshot);
    groups.set(item.farmer, group);
  }
  return [...groups.values()].map((group) => ({
    ...group,
    subtotal:
      group.items.reduce(
        (sum, item) => sum + Math.round(item.lineTotal * 100),
        0,
      ) / 100,
    totalAmount:
      group.items.reduce(
        (sum, item) => sum + Math.round(item.lineTotal * 100),
        0,
      ) / 100,
  }));
}
export function inventoryChange(product, quantity, restore = false) {
  const remaining =
    product.availableQuantity + (restore ? quantity : -quantity);
  if (remaining < 0) throw new ProductError("Insufficient stock", 409);
  return {
    availableQuantity: remaining,
    status: productStatus(remaining, product.status),
  };
}
export const serializeCommerce = (value) => JSON.parse(JSON.stringify(value));
export function parseCommerce(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success)
    throw new ProductError(
      result.error.issues[0]?.message || "Invalid request",
      400,
    );
  return result.data;
}
