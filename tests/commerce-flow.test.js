import test, { beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, createHmac } from "node:crypto";
import mongoose from "mongoose";
import { readFileSync } from "node:fs";
import { ProductError } from "../lib/productErrors.js";
import { readCommerceRequest } from "../lib/commerceRequest.js";
import Notification from "../models/Notification.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import CheckoutAttempt from "../models/CheckoutAttempt.js";
import { placeCodOrder, updateOrderStatus } from "../services/orderService.js";
import {
  createTestPayment,
  verifyTestPayment,
} from "../services/paymentService.js";
const buyer = { id: "507f1f77bcf86cd799439021", role: "BUYER" };
const farmer = { id: "507f1f77bcf86cd799439022", role: "FARMER" };
const secondFarmer = "507f1f77bcf86cd799439023";
const productId = "507f1f77bcf86cd799439024";
const secondId = "507f1f77bcf86cd799439025";
const address = {
  fullName: "Test Buyer",
  phone: "9876543210",
  addressLine1: "12 Farm Road",
  addressLine2: "",
  villageOrCity: "Pune",
  district: "Pune",
  state: "Maharashtra",
  postalCode: "411001",
};
let carts, products, attempts, orders, failInventory;
const previousSecret = process.env.RAZORPAY_KEY_SECRET;
const clone = (value) => JSON.parse(JSON.stringify(value));
const match = (doc, query) =>
  Object.entries(query).every(([key, value]) =>
    value && typeof value === "object" && "$ne" in value
      ? doc[key] !== value.$ne
      : String(doc[key]) === String(value),
  );
function query(value) {
  return {
    session() {
      return this;
    },
    populate() {
      return this;
    },
    lean() {
      return this;
    },
    then(resolve, reject) {
      return Promise.resolve(value).then(resolve, reject);
    },
  };
}
beforeEach(() => {
  process.env.RAZORPAY_KEY_SECRET = "mock-test-secret";
  globalThis.farmdirectMongo.connection = {};
  failInventory = false;
  carts = [];
  attempts = [];
  orders = [];
  products = [productId, secondId].map((id, index) => ({
    _id: id,
    __v: 0,
    name: index ? "Rice" : "Tomatoes",
    farmer: {
      _id: index ? secondFarmer : farmer.id,
      role: "FARMER",
      accountStatus: "ACTIVE",
    },
    price: index ? 20 : 10,
    category: "Vegetables",
    unit: "KG",
    images: [],
    status: "ACTIVE",
    availableQuantity: 10,
    minimumOrderQuantity: 1,
  }));
  carts.push(
    new Cart({
      buyer: buyer.id,
      items: products.map((p) => ({ product: p._id, quantity: 2 })),
      __v: 0,
    }),
  );
  for (const model of [Cart, Order, CheckoutAttempt])
    mock.method(model, "init", async () => model);
  mock.method(mongoose, "startSession", async () => ({
    async withTransaction(callback) {
      const backup = {
        carts: clone(carts),
        products: clone(products),
        attempts: clone(attempts),
        orders: clone(orders),
      };
      try {
        return await callback();
      } catch (error) {
        carts = backup.carts.map((d) => new Cart(d));
        products = backup.products;
        attempts = backup.attempts.map((d) => new CheckoutAttempt(d));
        orders = backup.orders.map((d) => new Order(d));
        throw error;
      }
    },
    async endSession() {},
  }));
  mock.method(Cart, "findOne", (q) =>
    query(carts.find((c) => match(c, q)) || null),
  );
  mock.method(Cart.prototype, "save", async function () {
    this.__v = (this.__v || 0) + 1;
    return this;
  });
  mock.method(Product, "find", (q) =>
    query(
      products.filter((p) => q._id.$in.map(String).includes(String(p._id))),
    ),
  );
  mock.method(Product, "findById", (id) =>
    query(products.find((p) => p._id === String(id)) || null),
  );
  mock.method(Product, "updateOne", async (q, update) => {
    const p = products.find((p) => match(p, q));
    if (!p || (failInventory && String(q._id) === secondId)) return { modifiedCount: 0 };
    Object.assign(p, update.$set);
    p.__v += update.$inc.__v;
    return { modifiedCount: 1 };
  });
  mock.method(CheckoutAttempt, "findOne", (q) =>
    query(attempts.find((d) => match(d, q)) || null),
  );
  mock.method(CheckoutAttempt, "create", async (rows) =>
    rows.map((row) => {
      const doc = new CheckoutAttempt(row);
      attempts.push(doc);
      return doc;
    }),
  );
  mock.method(CheckoutAttempt.prototype, "save", async function () {
    return this;
  });
  mock.method(CheckoutAttempt, "updateOne", async (q, u) => {
    const doc = attempts.find((d) => match(d, q));
    if (doc) Object.assign(doc, u.$set);
    return { modifiedCount: doc ? 1 : 0 };
  });
  mock.method(Order, "create", async (rows, options) => {
    assert.equal(options.ordered, true);
    return rows.map((row) => {
      const doc = new Order(row);
      orders.push(doc);
      return doc;
    });
  });
  mock.method(Notification, "bulkWrite", async () => ({}));
  mock.method(Order, "find", q => query(orders.filter(o => q._id.$in.map(String).includes(String(o._id)))));
  mock.method(Order, "findById", (id) =>
    query(orders.find((o) => String(o._id) === String(id)) || null),
  );
  mock.method(Order.prototype, "save", async function () {
    this.__v = (this.__v || 0) + 1;
    return this;
  });
});
afterEach(() => {
  mock.restoreAll();
  if (previousSecret === undefined) delete process.env.RAZORPAY_KEY_SECRET;
  else process.env.RAZORPAY_KEY_SECRET = previousSecret;
});
const input = (method) => ({
  shippingAddress: address,
  paymentMethod: method,
  requestId: randomUUID(),
});
const gateway = () => ({
  orders: {
    async create(values) {
      return { id: "order_Mocked", amount: values.amount, currency: "INR" };
    },
  },
  payments: {
    async fetch(id) {
      return {
        id,
        order_id: "order_Mocked",
        amount: 6000,
        currency: "INR",
        status: "captured",
      };
    },
  },
});
function signed() {
  return {
    razorpay_order_id: "order_Mocked",
    razorpay_payment_id: "pay_Mocked",
    razorpay_signature: createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update("order_Mocked|pay_Mocked")
      .digest("hex"),
  };
}
test("COD creates two farmer orders, snapshots DB prices, reduces stock and clears cart", async () => {
  const result = await placeCodOrder(buyer, input("COD"));
  assert.equal(result.orderIds.length, 2);
  assert.equal(orders.length, 2);
  assert.equal(orders[0].totalAmount, 20);
  assert.equal(orders[1].totalAmount, 40);
  assert.equal(orders[0].paymentStatus, "PENDING");
  assert.deepEqual(
    products.map((p) => p.availableQuantity),
    [8, 8],
  );
  assert.equal(carts[0].items.length, 0);
  products[0].price = 99;
  products[0].name = "Changed";
  assert.equal(orders[0].items[0].priceAtOrder, 10);
  assert.equal(orders[0].items[0].productName, "Tomatoes");
});
test("COD replay is idempotent even after cart is cleared", async () => {
  const values = input("COD");
  const first = await placeCodOrder(buyer, values);
  const second = await placeCodOrder(buyer, values);
  assert.deepEqual(second, first);
  assert.equal(orders.length, 2);
  assert.equal(products[0].availableQuantity, 8);
});
test("inventory conditional failure rolls back orders, other stock and cart", async () => {
  failInventory = true;
  await assert.rejects(placeCodOrder(buyer, input("COD")));
  assert.equal(orders.length, 0);
  assert.equal(attempts.length, 0);
  assert.equal(products[0].availableQuantity, 10);
  assert.equal(carts[0].items.length, 2);
});
test("farmer cancellation restores exactly once and records history", async () => {
  const { orderIds } = await placeCodOrder(buyer, input("COD"));
  await updateOrderStatus(farmer, orderIds[0], { status: "CANCELLED" });
  assert.equal(products[0].availableQuantity, 10);
  assert.equal(products[1].availableQuantity, 8);
  assert.equal(orders[0].inventoryRestored, true);
  await assert.rejects(
    updateOrderStatus(farmer, orderIds[0], { status: "CANCELLED" }),
  );
  assert.equal(products[0].availableQuantity, 10);
  assert.equal(orders[0].statusHistory.length, 2);
});
test("only owning farmer advances fulfilment; COD becomes paid at delivery", async () => {
  const { orderIds } = await placeCodOrder(buyer, input("COD"));
  await assert.rejects(
    updateOrderStatus({ id: secondFarmer, role: "FARMER" }, orderIds[0], {
      status: "CONFIRMED",
    }),
  );
  await assert.rejects(
    updateOrderStatus(buyer, orderIds[0], { status: "CONFIRMED" }),
  );
  for (const status of ["CONFIRMED", "PACKED", "SHIPPED"]) {
    await updateOrderStatus(farmer, orderIds[0], { status });
    assert.equal(orders[0].paymentStatus, "PENDING");
  }
  await updateOrderStatus(farmer, orderIds[0], { status: "DELIVERED" });
  assert.equal(orders[0].paymentStatus, "PAID");
  assert.equal(orders[0].statusHistory.length, 5);
});
test("Razorpay amount is server-calculated; creation does not touch stock or cart", async () => {
  const values = input("RAZORPAY");
  const api = gateway();
  let amount;
  api.orders.create = async (v) => {
    amount = v.amount;
    return { id: "order_Mocked", amount: v.amount, currency: "INR" };
  };
  await createTestPayment(buyer, values, api);
  assert.equal(amount, 6000);
  assert.equal(orders.length, 0);
  assert.equal(products[0].availableQuantity, 10);
  assert.equal(carts[0].items.length, 2);
});
test("invalid signature marks attempt failed without fulfilment", async () => {
  await createTestPayment(buyer, input("RAZORPAY"), gateway());
  await assert.rejects(
    verifyTestPayment(
      buyer,
      { ...signed(), razorpay_signature: "0".repeat(64) },
      gateway(),
    ),
  );
  assert.equal(attempts[0].status, "FAILED");
  assert.equal(orders.length, 0);
  assert.equal(products[0].availableQuantity, 10);
  assert.equal(carts[0].items.length, 2);
});
test("valid verification is idempotent and paid test cancellation retains audit", async () => {
  await createTestPayment(buyer, input("RAZORPAY"), gateway());
  const callback = signed();
  const first = await verifyTestPayment(buyer, callback, gateway());
  const second = await verifyTestPayment(buyer, callback, gateway());
  assert.deepEqual(first, second);
  assert.equal(orders.length, 2);
  assert.equal(products[0].availableQuantity, 8);
  assert.equal(orders[0].paymentStatus, "PAID");
  await updateOrderStatus(farmer, first.orderIds[0], { status: "CANCELLED" });
  assert.equal(products[0].availableQuantity, 10);
  assert.equal(orders[0].razorpay.paymentId, "pay_Mocked");
  assert.equal(orders[0].paymentStatus, "PAID");
});
test("failed gateway payment leaves cart and inventory unchanged", async () => {
  const api = gateway();
  await createTestPayment(buyer, input("RAZORPAY"), api);
  api.payments.fetch = async (id) => ({
    id,
    order_id: "order_Mocked",
    amount: 6000,
    currency: "INR",
    status: "failed",
  });
  await assert.rejects(verifyTestPayment(buyer, signed(), api));
  assert.equal(orders.length, 0);
  assert.equal(products[0].availableQuantity, 10);
  assert.equal(carts[0].items.length, 2);
});
test("changed price or unit prevents paid fulfilment and preserves cart", async () => {
  await createTestPayment(buyer, input("RAZORPAY"), gateway());
  products[0].price = 11;
  await assert.rejects(verifyTestPayment(buyer, signed(), gateway()));
  products[0].price = 10;
  products[0].unit = "TON";
  await assert.rejects(verifyTestPayment(buyer, signed(), gateway()));
  assert.equal(orders.length, 0);
  assert.equal(products[0].availableQuantity, 10);
  assert.equal(carts[0].items.length, 2);
});
test("another buyer cannot consume a payment attempt", async () => {
  await createTestPayment(buyer, input("RAZORPAY"), gateway());
  await assert.rejects(
    verifyTestPayment({ id: secondFarmer, role: "BUYER" }, signed(), gateway()),
  );
  assert.equal(orders.length, 0);
});
test("guest and farmer cannot place buyer checkout", async () => {
  await assert.rejects(
    placeCodOrder(null, input("COD")),
    (e) => e.status === 401,
  );
  await assert.rejects(
    placeCodOrder(farmer, input("COD")),
    (e) => e.status === 403,
  );
});

// Exercise the actual route handler with Next/session boundaries injected;
// the order service and its transaction/inventory code are the real implementation.
const routeSource = readFileSync(
  new URL("../app/api/farmer/orders/[id]/status/route.js", import.meta.url), "utf8",
).replace(/^import .*;$/gm, "").replace("export async function PATCH", "async function PATCH");
function statusRoute(user, service = updateOrderStatus) {
  return new Function(
    "NextResponse", "requireProductUser", "ProductError", "productErrorResponse",
    "requireProductOrigin", "readCommerceRequest", "updateOrderStatus",
    routeSource + "\nreturn PATCH;",
  )(
    { json: (body, options) => Response.json(body, options) },
    async () => user,
    ProductError,
    (e) => Response.json({ message: e.message }, { status: e.status || 409 }),
    () => {},
    readCommerceRequest,
    service,
  );
}
function statusRequest(status) {
  return new Request("http://localhost/api/farmer/orders/test/status", {
    method: "PATCH", headers: { "content-type": "application/json" },
    body: JSON.stringify({ status }),
  });
}
async function routeResult(user, id, status, expected, service) {
  const response = await statusRoute(user, service)(statusRequest(status), {
    params: Promise.resolve({ id }),
  });
  assert.equal(response.status, expected);
  assert.match(response.headers.get("content-type"), /application\/json/);
  return response.json();
}
test("farmer status route accepts and rejects with JSON and restores inventory once", async () => {
  const { orderIds } = await placeCodOrder(buyer, input("COD"));
  const accepted = await routeResult(farmer, orderIds[0], "CONFIRMED", 200);
  assert.equal(accepted.orderStatus, "CONFIRMED");
  assert.equal(products[0].availableQuantity, 8);
  const owner = { id: secondFarmer, role: "FARMER" };
  const rejected = await routeResult(owner, orderIds[1], "CANCELLED", 200);
  assert.equal(rejected.orderStatus, "CANCELLED");
  assert.equal(products[1].availableQuantity, 10);
  await routeResult(owner, orderIds[1], "CANCELLED", 409);
  assert.equal(products[1].availableQuantity, 10);
});
test("farmer status route returns JSON for guest, buyer and another farmer", async () => {
  const { orderIds } = await placeCodOrder(buyer, input("COD"));
  await routeResult(null, orderIds[0], "CONFIRMED", 401);
  await routeResult(buyer, orderIds[0], "CONFIRMED", 403);
  await routeResult({ id: secondFarmer, role: "FARMER" }, orderIds[0], "CONFIRMED", 403);
  assert.equal(orders[0].orderStatus, "PENDING");
});
test("farmer status route returns JSON 400 for invalid ID and status", async () => {
  const { orderIds } = await placeCodOrder(buyer, input("COD"));
  await routeResult(farmer, "not-an-object-id", "CONFIRMED", 400);
  await routeResult(farmer, orderIds[0], "INVALID", 400);
});
test("farmer status route catches unexpected failures as safe JSON 500", async (t) => {
  t.mock.method(console, "error", () => {});
  const result = await routeResult(farmer, productId, "CONFIRMED", 500, async () => {
    throw new Error("private server error");
  });
  assert.deepEqual(result, { success: false, error: "Unable to update order status" });
});
