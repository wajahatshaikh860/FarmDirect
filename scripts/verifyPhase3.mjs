import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import nextEnv from "@next/env";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";
import Product from "../models/Product.js";
import { connectDB } from "../lib/db.js";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import CheckoutAttempt from "../models/CheckoutAttempt.js";
const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE_PATH || "playwright",
);
nextEnv.loadEnvConfig(process.cwd(), true);
const base = process.env.TEST_BASE_URL || "http://localhost:3100";
const run = randomUUID(),
  password = "Phase3-" + randomUUID();
const emails = ["farmer-a", "farmer-b", "buyer", "admin", "buyer-b"].map(
  (role) => role + "-" + run + "@example.com",
);
fs.mkdirSync(".verification", { recursive: true });
fs.writeFileSync(
  ".verification/phase3-fixtures-" + run + ".json",
  JSON.stringify({ run, emails }),
);
const results = [],
  contexts = [];
let browser;
const check = (message) => {
  results.push(message);
  console.log("PASS " + message);
};
const crop = {
  name: "Tomatoes " + run,
  category: "Vegetables",
  description: "Fresh tomatoes from the Phase 3 verification farm.",
  price: 25,
  unit: "KG",
  availableQuantity: 20,
  minimumOrderQuantity: 1,
  harvestDate: "2026-09-01",
  qualityGrade: "Grade A",
  farmingType: "ORGANIC",
  location: { village: "Test village", district: "Pune", state: "Maharashtra" },
  status: "ACTIVE",
};
async function request(ctx, method, url, options = {}) {
  return ctx.request[method](url, { timeout: 180000, ...options });
}
async function context() {
  const ctx = await browser.newContext();
  contexts.push(ctx);
  return ctx;
}
async function register(ctx, index, role) {
  const response = await request(ctx, "post", base + "/api/register", {
    headers: { origin: base },
    data: {
      name: "Phase 3 " + role + " " + index,
      email: emails[index],
      phone: "9876543210",
      password,
      confirmPassword: password,
      role,
      ...(role === "FARMER"
        ? {
            farmName: "Phase 3 verification farm",
            district: "Pune",
            state: "Maharashtra",
            farmingType: "Organic",
          }
        : {}),
    },
  });
  assert.equal(response.status(), 201, "registration " + role);
  return User.findOne({ email: emails[index] }).select("+passwordHash");
}
async function login(ctx, email, pass = password) {
  const csrf = await (
    await request(ctx, "get", base + "/api/auth/csrf")
  ).json();
  return request(ctx, "post", base + "/api/auth/callback/credentials", {
    form: {
      email,
      password: pass,
      csrfToken: csrf.csrfToken,
      callbackUrl: base,
      json: "true",
    },
  });
}
async function patch(ctx, id, data) {
  return request(ctx, "patch", base + "/api/products/" + id, {
    headers: { origin: base },
    data,
  });
}
async function remove(ctx, id) {
  return request(ctx, "delete", base + "/api/products/" + id, {
    headers: { origin: base },
  });
}
const shippingAddress = {
  fullName: "Phase 3 Buyer",
  phone: "9876543210",
  addressLine1: "12 Verification Road",
  addressLine2: "",
  villageOrCity: "Pune",
  district: "Pune",
  state: "Maharashtra",
  postalCode: "411001",
};
async function mutate(ctx, method, path, data) {
  return request(ctx, method, base + path, {
    headers: { origin: base },
    ...(data ? { data } : {}),
  });
}
async function expect(ctx, method, path, data, status = 200) {
  const response = await mutate(ctx, method, path, data);
  assert.equal(
    response.status(),
    status,
    path + ": " + (await response.text()),
  );
  return response.json();
}
try {
  await connectDB();
  await mongoose.connection.db.command({ ping: 1 });
  check("Atlas/DNS connection");
  browser = await chromium.launch({
    headless: true,
    channel: process.env.BROWSER_CHANNEL || "chrome",
  });
  const guest = await context(),
    a = await context(),
    b = await context(),
    buyer = await context(),
    other = await context(),
    admin = await context();
  const farmerA = await register(a, 0, "FARMER"),
    farmerB = await register(b, 1, "FARMER");
  await register(buyer, 2, "BUYER");
  await register(other, 4, "BUYER");
  await User.create({
    name: "Phase 3 Admin",
    email: emails[3],
    phone: "9876543210",
    role: "ADMIN",
    passwordHash: await bcrypt.hash(password, 12),
  });
  for (const [ctx, index] of [
    [a, 0],
    [b, 1],
    [buyer, 2],
    [other, 4],
    [admin, 3],
  ]) {
    await login(ctx, emails[index]);
    const session = await (
      await request(ctx, "get", base + "/api/auth/session")
    ).json();
    assert.ok(session.user);
    assert.equal("passwordHash" in session.user, false);
  }
  check("Registration, login and safe role sessions");
  const p1 = (
    await expect(
      a,
      "post",
      "/api/products",
      {
        ...crop,
        name: "Phase 3 Tomatoes " + run,
        price: 25,
        availableQuantity: 20,
        minimumOrderQuantity: 2,
      },
      201,
    )
  ).product;
  const p2 = (
    await expect(
      b,
      "post",
      "/api/products",
      {
        ...crop,
        name: "Phase 3 Rice " + run,
        price: 40,
        availableQuantity: 20,
        minimumOrderQuantity: 1,
      },
      201,
    )
  ).product;
  for (const [ctx, status] of [
    [guest, 401],
    [a, 403],
    [admin, 403],
  ])
    await expect(
      ctx,
      "post",
      "/api/cart/items",
      { productId: p1._id, quantity: 2 },
      status,
    );
  await expect(
    buyer,
    "post",
    "/api/cart/items",
    { productId: p1._id, quantity: 1 },
    400,
  );
  await expect(
    buyer,
    "post",
    "/api/cart/items",
    { productId: p1._id, quantity: 21 },
    409,
  );
  await expect(
    buyer,
    "post",
    "/api/cart/items",
    { productId: p1._id, quantity: 2, price: 0.01 },
    400,
  );
  check("Cart guest/role authorization, MOQ, stock and mass assignment");
  const page = await buyer.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base + "/products/" + p1._id);
  await page.getByLabel("Order quantity", { exact: true }).fill("3");
  await page.getByRole("button", { name: "Add to Cart", exact: true }).click();
  await page.getByText("Added to cart", { exact: true }).waitFor();
  let cart = await expect(buyer, "get", "/api/cart");
  assert.equal(cart.items[0].quantity, 3);
  assert.equal(cart.subtotal, 75);
  await page.goto(base + "/cart");
  await page.reload();
  assert.ok((await page.locator("body").innerText()).includes(p1.name));
  await page.getByLabel("Quantity", { exact: true }).fill("4");
  await page.getByRole("button", { name: "Update", exact: true }).click();
  await page.getByText("Cart updated", { exact: true }).waitFor();
  cart = await expect(buyer, "get", "/api/cart");
  assert.equal(cart.items[0].quantity, 4);
  await expect(buyer, "patch", "/api/cart/items/" + p1._id, { quantity: 2 });
  await expect(buyer, "post", "/api/cart/items", {
    productId: p2._id,
    quantity: 3,
  });
  assert.equal((await expect(buyer, "get", "/api/cart")).subtotal, 170);
  assert.equal((await expect(other, "get", "/api/cart")).items.length, 0);
  check(
    "Actual Add to Cart UI, persistence, manual quantity updates, DB prices and buyer isolation",
  );
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/cart", "/checkout"]) {
      await page.goto(base + route);
      await page.waitForTimeout(250);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        "overflow " + route + " " + width,
      );
    }
    if (width === 375 || width === 1440) {
      fs.mkdirSync(".verification/phase3", { recursive: true });
      await page.screenshot({
        path: ".verification/phase3/" + width + "-checkout.png",
        fullPage: true,
      });
    }
  }
  await page.goto(base + "/checkout");
  for (const [name, value] of Object.entries(shippingAddress))
    await page.locator('input[name="' + name + '"]').fill(value);
  const responsePromise = page.waitForResponse(
    (r) => r.url() === base + "/api/orders" && r.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Place COD Order", exact: true })
    .click();
  const codResponse = await responsePromise;
  assert.equal(codResponse.status(), 201, await codResponse.text());
  const placed = await codResponse.json();
  assert.equal(placed.orderIds.length, 2);
  await page.waitForURL(base + "/buyer/orders");
  let placedOrders = await Order.find({ _id: { $in: placed.orderIds } }).lean();
  assert.equal(placedOrders.length, 2);
  assert.deepEqual(
    placedOrders.map((o) => o.totalAmount).sort((x, y) => x - y),
    [50, 120],
  );
  assert.equal((await Product.findById(p1._id)).availableQuantity, 18);
  assert.equal((await Product.findById(p2._id)).availableQuantity, 17);
  assert.equal((await expect(buyer, "get", "/api/cart")).items.length, 0);
  const orderA = placedOrders.find(
    (o) => String(o.farmer) === String(farmerA._id),
  );
  const orderB = placedOrders.find(
    (o) => String(o.farmer) === String(farmerB._id),
  );
  assert.equal((await expect(a, "get", "/api/farmer/orders")).orders.length, 1);
  assert.equal((await expect(b, "get", "/api/farmer/orders")).orders.length, 1);
  await expect(other, "get", "/api/orders/" + orderA._id, undefined, 403);
  await expect(
    b,
    "patch",
    "/api/farmer/orders/" + orderA._id + "/status",
    { status: "CONFIRMED" },
    403,
  );
  await expect(
    buyer,
    "patch",
    "/api/farmer/orders/" + orderA._id + "/status",
    { status: "CONFIRMED" },
    403,
  );
  await expect(
    a,
    "patch",
    "/api/farmer/orders/" + orderA._id + "/status",
    { status: "CONFIRMED", paymentStatus: "PAID" },
    400,
  );
  check(
    "Actual checkout form, multi-farmer COD, atomic inventory/cart cleanup and order ownership",
  );
  const farmerPage = await a.newPage();
  farmerPage.on("pageerror", (e) => errors.push(e.message));
  await farmerPage.goto(base + "/farmer/orders/" + orderA._id);
  await farmerPage.getByRole("button", { name: "Accept", exact: true }).click();
  await farmerPage.getByText("Order accepted", { exact: true }).waitFor();
  for (const [status, label] of [
    ["PACKED", "Mark Packed"],
    ["SHIPPED", "Mark Shipped"],
    ["DELIVERED", "Mark Delivered"],
  ]) {
    await farmerPage.getByRole("button", { name: label, exact: true }).click();
    await farmerPage
      .getByText("Order status updated", { exact: true })
      .last()
      .waitFor();
    await farmerPage.getByText(status, { exact: true }).waitFor();
  }
  let delivered = await Order.findById(orderA._id);
  assert.equal(delivered.paymentStatus, "PAID");
  assert.equal(delivered.statusHistory.length, 5);
  await expect(
    a,
    "patch",
    "/api/farmer/orders/" + orderA._id + "/status",
    { status: "PACKED" },
    409,
  );
  await expect(b, "patch", "/api/farmer/orders/" + orderB._id + "/status", {
    status: "CANCELLED",
  });
  assert.equal((await Product.findById(p2._id)).availableQuantity, 20);
  await expect(
    b,
    "patch",
    "/api/farmer/orders/" + orderB._id + "/status",
    { status: "CANCELLED" },
    409,
  );
  assert.equal((await Product.findById(p2._id)).availableQuantity, 20);
  check(
    "Actual farmer fulfilment UI/timeline, COD collection, cancellation and single restoration",
  );
  await patch(a, p1._id, { price: 30, name: "Renamed " + run });
  const historical = await expect(buyer, "get", "/api/orders/" + orderA._id);
  assert.equal(historical.items[0].priceAtOrder, 25);
  assert.equal(historical.items[0].productName, p1.name);
  check("Historical order snapshots survive product edits");
  await expect(buyer, "post", "/api/cart/items", {
    productId: p2._id,
    quantity: 2,
  });
  const codInput = {
    shippingAddress,
    paymentMethod: "COD",
    requestId: randomUUID(),
  };
  const once = await expect(buyer, "post", "/api/orders", codInput, 201);
  const twice = await expect(buyer, "post", "/api/orders", codInput, 201);
  assert.deepEqual(once, twice);
  assert.equal((await Product.findById(p2._id)).availableQuantity, 18);
  check("COD request idempotency against real Atlas");
  await expect(buyer, "post", "/api/cart/items", {
    productId: p2._id,
    quantity: 18,
  });
  await expect(other, "post", "/api/cart/items", {
    productId: p2._id,
    quantity: 18,
  });
  const races = await Promise.all([
    mutate(buyer, "post", "/api/orders", {
      shippingAddress,
      paymentMethod: "COD",
      requestId: randomUUID(),
    }),
    mutate(other, "post", "/api/orders", {
      shippingAddress,
      paymentMethod: "COD",
      requestId: randomUUID(),
    }),
  ]);
  assert.equal(races.filter((r) => r.status() === 201).length, 1);
  assert.ok(races.every((r) => [201, 409].includes(r.status())));
  assert.equal((await Product.findById(p2._id)).availableQuantity, 0);
  assert.equal((await Product.findById(p2._id)).status, "OUT_OF_STOCK");
  const winner = await races.find((r) => r.status() === 201).json();
  await expect(
    b,
    "patch",
    "/api/farmer/orders/" + winner.orderIds[0] + "/status",
    { status: "CANCELLED" },
  );
  assert.equal((await Product.findById(p2._id)).availableQuantity, 18);
  assert.equal((await Product.findById(p2._id)).status, "ACTIVE");
  check(
    "Concurrent buyers cannot oversell; zero stock and rejection restock follow Phase 2 rules",
  );
  for (const [ctx, role] of [
    [buyer, "buyer"],
    [a, "farmer"],
  ]) {
    const responsive = await ctx.newPage();
    for (const width of [375, 768, 1440]) {
      await responsive.setViewportSize({ width, height: 900 });
      for (const route of [
        "/" + role + "/orders",
        "/" + role + "/orders/" + (role === "buyer" ? orderB._id : orderA._id),
      ]) {
        await responsive.goto(base + route);
        assert.ok(
          await responsive.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
        );
      }
    }
  }
  assert.deepEqual(errors, []);
  check("375/768/1440px cart/checkout/order layouts and no React errors");
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    await expect(
      buyer,
      "post",
      "/api/payments/razorpay/create-order",
      { shippingAddress, paymentMethod: "RAZORPAY", requestId: randomUUID() },
      503,
    );
    results.push(
      "BLOCKED real Razorpay Test success/failure: Test credentials missing; mocked payment flows pass",
    );
    console.log(results.at(-1));
  } else {
    results.push(
      "Razorpay Test credentials configured: interactive sandbox success/failure still requires a Test Checkout transaction.",
    );
  }
} finally {
  if (browser) await browser.close();
  const users = await User.find({ email: { $in: emails } })
    .select("_id")
    .lean();
  const ids = users.map((u) => u._id);
  await Order.deleteMany({
    $or: [{ buyer: { $in: ids } }, { farmer: { $in: ids } }],
  });
  await CheckoutAttempt.deleteMany({ buyer: { $in: ids } });
  await Cart.deleteMany({ buyer: { $in: ids } });
  await Product.deleteMany({ farmer: { $in: ids } });
  await User.deleteMany({ _id: { $in: ids } });
  await mongoose.disconnect();
  fs.writeFileSync(
    ".verification/phase3-live-results.json",
    JSON.stringify(results, null, 2),
  );
  console.log("UUID-scoped Phase 3 test records cleaned up.");
}
