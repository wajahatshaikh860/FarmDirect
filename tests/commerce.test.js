import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { cartItemSchema } from "../validators/cartValidator.js";
import { checkoutSchema, statusSchema } from "../validators/orderValidator.js";
import {
  assertQuantity,
  checkoutSnapshot,
  groupOrders,
  linePaise,
  assertOwner,
  assertTransition,
  inventoryChange,
} from "../lib/commerce.js";
import { verifyPaymentSignature, razorpayConfigured } from "../lib/razorpay.js";
const id = "507f1f77bcf86cd799439011";
const product = {
  _id: id,
  name: "Tomatoes",
  status: "ACTIVE",
  availableQuantity: 10,
  minimumOrderQuantity: 2,
  price: 12.35,
  unit: "KG",
  category: "Vegetables",
  farmer: {
    _id: "507f1f77bcf86cd799439012",
    role: "FARMER",
    accountStatus: "ACTIVE",
  },
  images: [],
};
test("cart accepts a valid product and precise positive quantity", () =>
  assert.equal(
    cartItemSchema.safeParse({ productId: id, quantity: 2.125 }).success,
    true,
  ));
test("cart rejects injected owner, price, stock and Mongo operators", () => {
  for (const key of ["buyer", "farmer", "price", "availableQuantity", "$set"])
    assert.equal(
      cartItemSchema.safeParse({ productId: id, quantity: 2, [key]: 1 })
        .success,
      false,
    );
});
test("cart rejects nonfinite, negative, zero and excessive precision quantities", () => {
  for (const quantity of [NaN, Infinity, -1, 0, 1.0001, "2"])
    assert.equal(
      cartItemSchema.safeParse({ productId: id, quantity }).success,
      false,
    );
});
test("quantity respects MOQ and stock limits", () => {
  assert.doesNotThrow(() => assertQuantity(product, 2));
  assert.throws(() => assertQuantity(product, 1));
  assert.throws(() => assertQuantity(product, 11));
});
test("hidden, deleted and out-of-stock products cannot be purchased", () => {
  for (const status of ["DISABLED", "OUT_OF_STOCK"])
    assert.throws(() => assertQuantity({ ...product, status }, 2));
  assert.throws(() => assertQuantity(null, 2));
});
test("totals use authoritative DB prices with integer paise rounding", () => {
  const items = checkoutSnapshot(
    [{ product: id, quantity: 2, price: 0.01 }],
    [product],
  );
  assert.equal(items[0].lineTotal, 24.7);
  assert.equal(linePaise(12.35, 2.125), 2624);
});
test("checkout refuses an inactive or missing farmer", () => {
  assert.throws(() =>
    checkoutSnapshot(
      [{ product: id, quantity: 2 }],
      [{ ...product, farmer: null }],
    ),
  );
  assert.throws(() =>
    checkoutSnapshot(
      [{ product: id, quantity: 2 }],
      [
        {
          ...product,
          farmer: { ...product.farmer, accountStatus: "SUSPENDED" },
        },
      ],
    ),
  );
});
test("multi-farmer grouping preserves snapshots and totals", () => {
  const a = checkoutSnapshot([{ product: id, quantity: 2 }], [product])[0];
  const groups = groupOrders([
    a,
    { ...a, product: "B", quantity: 3, lineTotal: 37.05 },
    { ...a, farmer: "farmer-b", product: "C", lineTotal: 15.25 },
  ]);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].totalAmount, 61.75);
  assert.equal(groups[1].totalAmount, 15.25);
  assert.equal(groups[0].items[0].priceAtOrder, 12.35);
  assert.equal("farmer" in groups[0].items[0], false);
});
test("buyer and farmer ownership enforce both role and identity", () => {
  const order = { buyer: "b", farmer: "f" };
  assert.doesNotThrow(() =>
    assertOwner({ id: "b", role: "BUYER" }, order, "BUYER"),
  );
  assert.doesNotThrow(() =>
    assertOwner({ id: "f", role: "FARMER" }, order, "FARMER"),
  );
  assert.throws(() =>
    assertOwner({ id: "other", role: "BUYER" }, order, "BUYER"),
  );
  assert.throws(() => assertOwner({ id: "f", role: "BUYER" }, order, "FARMER"));
});
test("every valid status transition is accepted", () => {
  for (const pair of [
    ["PENDING", "CONFIRMED"],
    ["PENDING", "CANCELLED"],
    ["CONFIRMED", "PACKED"],
    ["PACKED", "SHIPPED"],
    ["SHIPPED", "DELIVERED"],
  ])
    assert.doesNotThrow(() => assertTransition(...pair));
});
test("backward, skipped and repeated cancellation transitions fail", () => {
  for (const pair of [
    ["PENDING", "PAID"],
    ["DELIVERED", "PACKED"],
    ["CANCELLED", "CONFIRMED"],
    ["SHIPPED", "PENDING"],
    ["CANCELLED", "CANCELLED"],
    ["PENDING", "DELIVERED"],
  ])
    assert.throws(() => assertTransition(...pair));
});
test("inventory decrement cannot become negative and zero stock becomes out-of-stock", () => {
  assert.deepEqual(inventoryChange(product, 10), {
    availableQuantity: 0,
    status: "OUT_OF_STOCK",
  });
  assert.throws(() => inventoryChange(product, 11));
});
test("inventory restoration follows frozen Phase 2 status rules", () => {
  assert.deepEqual(
    inventoryChange(
      { ...product, availableQuantity: 0, status: "OUT_OF_STOCK" },
      2,
      true,
    ),
    { availableQuantity: 2, status: "ACTIVE" },
  );
  assert.equal(
    inventoryChange({ ...product, status: "DISABLED" }, 2, true).status,
    "DISABLED",
  );
});
test("signature uses stored order ID and timing-safe HMAC comparison", () => {
  const signature = createHmac("sha256", "test-secret")
    .update("order_server|pay_example")
    .digest("hex");
  assert.equal(
    verifyPaymentSignature(
      "order_server",
      "pay_example",
      signature,
      "test-secret",
    ),
    true,
  );
  assert.equal(
    verifyPaymentSignature(
      "order_client",
      "pay_example",
      signature,
      "test-secret",
    ),
    false,
  );
  assert.equal(
    verifyPaymentSignature(
      "order_server",
      "pay_other",
      signature,
      "test-secret",
    ),
    false,
  );
});
test("malformed and forged signatures fail safely", () => {
  for (const signature of ["bad", "", "0".repeat(64), undefined])
    assert.equal(
      verifyPaymentSignature("order_x", "pay_x", signature, "secret"),
      false,
    );
});
test("Live Razorpay keys are refused and missing credentials are safe", () => {
  const previous = [
    process.env.RAZORPAY_KEY_ID,
    process.env.RAZORPAY_KEY_SECRET,
  ];
  try {
    process.env.RAZORPAY_KEY_ID = "rzp_live_abc";
    process.env.RAZORPAY_KEY_SECRET = "secret";
    assert.equal(razorpayConfigured(), false);
    process.env.RAZORPAY_KEY_ID = "rzp_test_abc";
    assert.equal(razorpayConfigured(), true);
    delete process.env.RAZORPAY_KEY_SECRET;
    assert.equal(razorpayConfigured(), false);
  } finally {
    for (const [i, key] of [
      "RAZORPAY_KEY_ID",
      "RAZORPAY_KEY_SECRET",
    ].entries()) {
      if (previous[i] === undefined) delete process.env[key];
      else process.env[key] = previous[i];
    }
  }
});
test("checkout and status validation forbid forged totals, payment and statuses", () => {
  assert.equal(
    checkoutSchema.safeParse({
      shippingAddress: {},
      paymentMethod: "COD",
      requestId: "x",
      totalAmount: 1,
      paymentStatus: "PAID",
    }).success,
    false,
  );
  assert.equal(
    statusSchema.safeParse({ status: "CONFIRMED", paymentStatus: "PAID" })
      .success,
    false,
  );
});
