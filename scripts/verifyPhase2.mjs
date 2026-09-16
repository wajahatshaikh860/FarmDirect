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
const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE_PATH || "playwright",
);
nextEnv.loadEnvConfig(process.cwd(), true);
const base = process.env.TEST_BASE_URL || "http://localhost:3100";
const run = randomUUID(),
  password = "Phase2-" + randomUUID();
const emails = ["farmer-a", "farmer-b", "buyer", "admin"].map(
  (role) => role + "-" + run + "@example.com",
);
fs.mkdirSync(".verification", { recursive: true });
fs.writeFileSync(
  ".verification/phase2-fixtures-" + run + ".json",
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
  description: "Fresh tomatoes from the Phase 2 verification farm.",
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
      name: "Phase 2 " + role + " " + index,
      email: emails[index],
      phone: "9876543210",
      password,
      confirmPassword: password,
      role,
      ...(role === "FARMER"
        ? {
            farmName: "Phase 2 verification farm",
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
try {
  await connectDB();
  await mongoose.connection.db.command({ ping: 1 });
  check("MongoDB connection and DNS bootstrap");
  browser = await chromium.launch({
    headless: true,
    channel: process.env.BROWSER_CHANNEL || "chrome",
  });
  const anonymous = await context(),
    a = await context(),
    b = await context(),
    buyer = await context(),
    admin = await context();
  const recordA = await register(a, 0, "FARMER"),
    recordB = await register(b, 1, "FARMER"),
    recordBuyer = await register(buyer, 2, "BUYER");
  assert.equal(await bcrypt.compare(password, recordA.passwordHash), true);
  assert.notEqual(recordBuyer.passwordHash, password);
  check("Farmer/Buyer registration and password hashing");
  const duplicate = await request(a, "post", base + "/api/register", {
    headers: { origin: base },
    data: {
      name: "Duplicate",
      email: emails[0],
      phone: "9876543210",
      password,
      confirmPassword: password,
      role: "BUYER",
    },
  });
  assert.equal(duplicate.status(), 409);
  check("Duplicate email rejection");
  const publicAdmin = await request(anonymous, "post", base + "/api/register", {
    headers: { origin: base },
    data: {
      name: "Public admin",
      email: "admin-rejected-" + run + "@example.com",
      phone: "9876543210",
      password,
      confirmPassword: password,
      role: "ADMIN",
    },
  });
  assert.equal(publicAdmin.status(), 400);
  check("Public ADMIN registration rejection");
  await User.create({
    name: "Phase 2 Admin",
    email: emails[3],
    phone: "9876543210",
    role: "ADMIN",
    passwordHash: await bcrypt.hash(password, 12),
  });
  assert.equal(
    (await login(anonymous, emails[0], "wrong-password")).status(),
    401,
  );
  check("Wrong password rejected");
  for (const [ctx, email, role] of [
    [a, emails[0], "FARMER"],
    [b, emails[1], "FARMER"],
    [buyer, emails[2], "BUYER"],
    [admin, emails[3], "ADMIN"],
  ]) {
    assert.equal((await login(ctx, email)).status(), 200);
    const session = await (
      await request(ctx, "get", base + "/api/auth/session")
    ).json();
    assert.equal(session.user.role, role);
    assert.equal(session.user.passwordHash, undefined);
  }
  check("Credentials login and safe sessions for Farmer, Buyer, Admin");
  assert.equal(
    (
      await request(anonymous, "post", base + "/api/products", {
        headers: { origin: base },
        data: crop,
      })
    ).status(),
    401,
  );
  assert.equal(
    (
      await request(buyer, "post", base + "/api/products", {
        headers: { origin: base },
        data: crop,
      })
    ).status(),
    403,
  );
  check("Unauthenticated create 401; Buyer create 403");
  const page = await a.newPage();
  page.setDefaultTimeout(180000);
  const browserErrors = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  await page.goto(base + "/farmer/products/new", { waitUntil: "networkidle" });
  for (const [name, value] of [
    ["Product Name", crop.name],
    ["Description", crop.description],
    ["Price (₹)", "25"],
    ["Available Quantity", "20"],
    ["Minimum Order Quantity", "1"],
    ["Village", "Test village"],
    ["District", "Pune"],
    ["State", "Maharashtra"],
  ])
    await page.getByLabel(name, { exact: true }).fill(value);
  await page.locator('select[name="category"]').selectOption("Vegetables");
  await page.locator('select[name="farmingType"]').selectOption("ORGANIC");
  await page.getByRole("button", { name: "Add Product", exact: true }).click();
  await page.waitForURL("**/farmer/products", { timeout: 180000 });
  const mine = await (
      await request(a, "get", base + "/api/farmer/products")
    ).json(),
    productA = mine.products.find((product) => product.name === crop.name);
  assert.ok(productA);
  const id = productA._id;
  assert.equal(String(productA.farmer._id), recordA.id);
  assert.equal(productA.farmer.passwordHash, undefined);
  check("Product form creates real MongoDB product and own-product listing");
  const other = await (
    await request(b, "get", base + "/api/farmer/products")
  ).json();
  assert.ok(!other.products.some((product) => product._id === id));
  assert.equal((await patch(b, id, { price: 30 })).status(), 403);
  assert.equal((await remove(b, id)).status(), 403);
  assert.equal((await patch(buyer, id, { price: 30 })).status(), 403);
  assert.equal((await remove(buyer, id)).status(), 403);
  check(
    "Farmer B and Buyer cannot update/delete Farmer A product; own listing isolation",
  );
  assert.equal((await patch(a, id, { farmer: recordB.id })).status(), 400);
  assert.equal((await patch(a, id, { availableQuantity: 0.5 })).status(), 400);
  check("Mass assignment and invalid stock rejected");
  assert.equal((await patch(a, id, { price: 30 })).status(), 200);
  assert.equal(
    (await request(anonymous, "get", base + "/api/products/" + id)).status(),
    200,
  );
  check("Owner update and public product details");
  const second = await request(a, "post", base + "/api/products", {
    headers: { origin: base },
    data: { ...crop, name: "Mangoes " + run, category: "Fruits", price: 70 },
  });
  assert.equal(second.status(), 201);
  const id2 = (await second.json()).product._id;
  let listings = await (
    await request(
      anonymous,
      "get",
      base + "/api/products?q=" + encodeURIComponent(run) + "&sort=price-asc",
    )
  ).json();
  assert.deepEqual(
    listings.products.map((item) => item._id),
    [id, id2],
  );
  listings = await (
    await request(
      anonymous,
      "get",
      base + "/api/products?q=" + encodeURIComponent(run) + "&sort=price-desc",
    )
  ).json();
  assert.deepEqual(
    listings.products.map((item) => item._id),
    [id2, id],
  );
  listings = await (
    await request(
      anonymous,
      "get",
      base +
        "/api/products?q=" +
        encodeURIComponent(run) +
        "&category=Vegetables&farmingType=ORGANIC&qualityGrade=Grade%20A&state=Maharashtra&district=Pune&minPrice=20&maxPrice=40",
    )
  ).json();
  assert.deepEqual(
    listings.products.map((item) => item._id),
    [id],
  );
  check(
    "Public marketplace, search, category/location/type/grade/price filters and sorting",
  );
  assert.equal((await patch(a, id, { availableQuantity: 0 })).status(), 200);
  let detail = (
    await (await request(anonymous, "get", base + "/api/products/" + id)).json()
  ).product;
  assert.equal(detail.status, "OUT_OF_STOCK");
  assert.equal((await patch(a, id, { availableQuantity: 15 })).status(), 200);
  detail = (
    await (await request(anonymous, "get", base + "/api/products/" + id)).json()
  ).product;
  assert.equal(detail.status, "ACTIVE");
  check("Out-of-stock and restock derived correctly");
  assert.equal((await patch(a, id, { status: "DISABLED" })).status(), 200);
  assert.equal(
    (await request(anonymous, "get", base + "/api/products/" + id)).status(),
    404,
  );
  assert.equal(
    (await request(a, "get", base + "/api/products/" + id)).status(),
    200,
  );
  assert.equal((await patch(a, id, { price: 35 })).status(), 200);
  assert.equal(
    (await request(a, "get", base + "/api/products/" + id)).status(),
    200,
  );
  detail = (
    await (await request(a, "get", base + "/api/products/" + id)).json()
  ).product;
  assert.equal(detail.status, "DISABLED");
  assert.equal((await patch(a, id, { status: "ACTIVE" })).status(), 200);
  check("Hidden product stays private and partial edits preserve visibility");
  assert.equal((await patch(admin, id, { price: 30 })).status(), 200);
  check("Admin product management authorization");
  const adminPage = await admin.newPage();
  adminPage.setDefaultTimeout(180000);
  await adminPage.goto(base + "/farmer/products/" + id + "/edit", {
    waitUntil: "networkidle",
  });
  await adminPage.getByLabel("Price (₹)", { exact: true }).fill("31");
  await adminPage.getByRole("button", { name: "Save Changes" }).click();
  await adminPage.waitForURL("**/products/" + id);
  await adminPage.close();
  check("Admin shared edit form returns to public product details");
  for (const [ctx, role] of [
    [a, "farmer"],
    [buyer, "buyer"],
    [admin, "admin"],
  ]) {
    const p = await ctx.newPage();
    await p.goto(base + "/" + role + "/dashboard", {
      waitUntil: "networkidle",
    });
    assert.ok(new URL(p.url()).pathname === "/" + role + "/dashboard");
    await p.reload({ waitUntil: "networkidle" });
    assert.ok(new URL(p.url()).pathname === "/" + role + "/dashboard");
    const denied =
      role === "farmer" ? "buyer" : role === "buyer" ? "admin" : "farmer";
    await p.goto(base + "/" + denied + "/dashboard", {
      waitUntil: "networkidle",
    });
    assert.equal(new URL(p.url()).pathname, "/" + role + "/dashboard");
    await p.close();
  }
  check("Phase 1 dashboards, session persistence and cross-role RBAC");
  fs.mkdirSync(".verification/phase2", { recursive: true });
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      "/",
      "/login",
      "/register",
      "/marketplace",
      "/products/" + id,
      "/farmer/products",
      "/farmer/products/new",
      "/farmer/products/" + id + "/edit",
    ]) {
      const response = await page.goto(base + route, {
        waitUntil: "networkidle",
      });
      assert.equal(response.status(), 200, route);
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth,
        ),
        false,
        width + "px overflow " + route,
      );
      if (route === "/marketplace" && width === 375) {
        await page
          .getByRole("button", { name: "Filters", exact: false })
          .click();
        await page
          .locator('select[name="category"]')
          .waitFor({ state: "visible" });
      }
      if (
        width !== 768 &&
        ["/marketplace", "/products/" + id, "/farmer/products/new"].includes(
          route,
        )
      )
        await page.screenshot({
          path:
            ".verification/phase2/" +
            width +
            "-" +
            (route === "/marketplace"
              ? "marketplace"
              : route.startsWith("/products/")
                ? "details"
                : "form") +
            ".png",
          fullPage: true,
        });
    }
    check("Responsive layouts at " + width + "px");
  }
  assert.deepEqual(browserErrors, []);
  check("No browser React errors");
  await page.goto(base + "/farmer/products/" + id + "/edit", {
    waitUntil: "networkidle",
  });
  await page
    .getByLabel("Product Name", { exact: true })
    .fill(crop.name + " edited");
  await page.getByRole("button", { name: "Save Changes" }).click();
  await page.waitForURL("**/farmer/products");
  check("Shared edit form saves changes");
  await page.goto(base + "/farmer/products", { waitUntil: "networkidle" });
  const target = page.getByRole("article").filter({
    has: page.getByRole("heading", {
      name: crop.name + " edited",
      exact: true,
    }),
  });
  page.once("dialog", (dialog) => dialog.accept());
  await target.getByRole("button", { name: "Delete", exact: true }).click();
  await page
    .getByText("Product deleted successfully", { exact: true })
    .waitFor();
  assert.equal(
    (await request(anonymous, "get", base + "/api/products/" + id)).status(),
    404,
  );
  check("Owner deletion with confirmation");
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("button", { name: "Logout", exact: true })
    .click();
  await page.waitForURL(base + "/");
  await page.waitForTimeout(500);
  const loggedOut = await (
    await request(a, "get", base + "/api/auth/session")
  ).json();
  assert.ok(!loggedOut.user);
  check("Phase 1 logout clears session");
  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    const form = new FormData();
    form.append("data", JSON.stringify({ ...crop, name: "Cloudinary " + run }));
    form.append(
      "images",
      new Blob(
        [
          Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5f0AAAAASUVORK5CYII=",
            "base64",
          ),
        ],
        { type: "image/png" },
      ),
      "produce.png",
    );
    await login(a, emails[0]);
    const csrfCookies = (await a.cookies())
      .map((cookie) => cookie.name + "=" + cookie.value)
      .join("; ");
    const response = await fetch(base + "/api/products", {
      method: "POST",
      headers: { origin: base, cookie: csrfCookies },
      body: form,
    });
    assert.equal(response.status, 201);
    const uploaded = (await response.json()).product;
    assert.equal(uploaded.images.length, 1);
    assert.equal((await remove(a, uploaded._id)).status(), 200);
    check("Live Cloudinary upload and delete cleanup");
  } else {
    results.push("BLOCKED live Cloudinary: credentials missing");
    console.log("BLOCKED live Cloudinary: credentials missing");
  }
} finally {
  if (browser) await browser.close();
  // UUID-scoped fixtures only; never delete existing users or products.
  const fixtureUsers = await User.find({ email: { $in: emails } })
    .select("_id")
    .lean();
  const ids = fixtureUsers.map((user) => user._id);
  const fixtures = await Product.find({ farmer: { $in: ids } }).lean();
  if (fixtures.some((product) => product.images.length)) {
    const { cleanupProductImages } = await import("../lib/cloudinary.js");
    for (const product of fixtures)
      await cleanupProductImages(product.images, String(product.farmer));
  }
  await Product.deleteMany({ farmer: { $in: ids } });
  await User.deleteMany({ _id: { $in: ids } });
  await mongoose.disconnect();
  fs.mkdirSync(".verification", { recursive: true });
  fs.writeFileSync(
    ".verification/phase2-live-results.json",
    JSON.stringify(results, null, 2),
  );
  console.log("Temporary verification records cleaned up.");
}
