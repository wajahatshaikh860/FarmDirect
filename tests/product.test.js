import test from "node:test";
import assert from "node:assert/strict";
import Product from "../models/Product.js";
import {
  productSchema,
  productPatchSchema,
  productQuerySchema,
} from "../validators/productValidator.js";
import { PRODUCT_CATEGORIES } from "../lib/constants.js";
import { productStatus, formatCurrency } from "../lib/productUtils.js";
import {
  requireProductOwner,
  requireProductRole,
} from "../lib/productPermissions.js";
import {
  buildProductQuery,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../services/productService.js";

globalThis.farmdirectMongo.connection = {};
const farmerA = { id: "507f1f77bcf86cd799439011", role: "FARMER" };
const farmerB = { id: "507f1f77bcf86cd799439012", role: "FARMER" };
const buyer = { id: "507f1f77bcf86cd799439013", role: "BUYER" };
const admin = { id: "507f1f77bcf86cd799439014", role: "ADMIN" };
const details = {
  name: "Fresh tomatoes",
  category: "Vegetables",
  description: "Freshly harvested local tomatoes.",
  price: 25,
  unit: "KG",
  availableQuantity: 20,
  minimumOrderQuantity: 1,
  qualityGrade: "Grade A",
  farmingType: "ORGANIC",
  location: { village: "Test village", district: "Pune", state: "Maharashtra" },
  status: "ACTIVE",
};
const record = () => new Product({ ...details, farmer: farmerA.id });

test("Product validation covers every central category and numeric form coercion", () => {
  for (const category of PRODUCT_CATEGORIES)
    assert.equal(
      productSchema.safeParse({ ...details, category }).success,
      true,
    );
  const parsed = productSchema.parse({
    ...details,
    price: "25",
    availableQuantity: "20",
    minimumOrderQuantity: "1",
  });
  assert.equal(parsed.price, 25);
  assert.equal(parsed.availableQuantity, 20);
});
test("Validation rejects invalid stock, prices, minimum quantities, dates, and mass assignment", () => {
  for (const patch of [
    { price: 0 },
    { price: -1 },
    { price: Infinity },
    { price: "" },
    { availableQuantity: -1 },
    { minimumOrderQuantity: 0 },
    { minimumOrderQuantity: 21 },
    { harvestDate: "2026-02-30" },
    { farmer: farmerB.id },
    { images: [{ url: "https://evil.example" }] },
    { slug: "forced" },
    { createdAt: "today" },
    { location: { $ne: null } },
  ])
    assert.equal(
      productSchema.safeParse({ ...details, ...patch }).success,
      false,
    );
  assert.equal(
    productSchema.safeParse({
      ...details,
      availableQuantity: 0,
      minimumOrderQuantity: 10,
    }).success,
    true,
  );
  assert.equal(
    productPatchSchema.safeParse({ farmer: farmerB.id }).success,
    false,
  );
});
test("A partial stock patch does not silently change listing visibility", () => {
  assert.deepEqual(productPatchSchema.parse({ availableQuantity: 0 }), {
    availableQuantity: 0,
  });
});
test("Search is literal, queries and sort options are whitelisted", () => {
  const { query, sort } = buildProductQuery({
    q: ".*tomato",
    state: "Maha.*",
    sort: "price-asc",
    minPrice: "10",
    maxPrice: "30",
  });
  assert.ok(query.$or[0].name.test(".*tomato"));
  assert.ok(!query.$or[0].name.test("any tomato"));
  assert.equal(query["location.state"].source, "^Maha\\.\\*$");
  assert.deepEqual(sort, { price: 1, _id: 1 });
  assert.deepEqual(query.price, { $gte: 10, $lte: 30 });
  assert.equal(productQuerySchema.safeParse({ sort: "$where" }).success, false);
  assert.equal(
    productQuerySchema.safeParse({ category: { $ne: null } }).success,
    false,
  );
  assert.equal(
    productQuerySchema.safeParse({ minPrice: 30, maxPrice: 10 }).success,
    false,
  );
});
test("Marketplace excludes disabled listings and defaults to active products", () => {
  assert.equal(buildProductQuery().query.status, "ACTIVE");
  assert.deepEqual(buildProductQuery({ availability: "all" }).query.status, {
    $in: ["ACTIVE", "OUT_OF_STOCK"],
  });
  assert.equal(
    buildProductQuery({ availability: "out-of-stock" }).query.status,
    "OUT_OF_STOCK",
  );
});
test("Ownership allows the owning farmer and admin, denies another farmer and buyer", () => {
  const product = { farmer: farmerA.id };
  assert.doesNotThrow(() => requireProductOwner(farmerA, product));
  assert.doesNotThrow(() => requireProductOwner(admin, product));
  assert.throws(() => requireProductOwner(farmerB, product), { status: 403 });
  assert.throws(() => requireProductOwner(buyer, product), { status: 403 });
  assert.throws(() => requireProductRole(null), { status: 401 });
});
test("Create rejects buyer, admin and guest before persistence", async () => {
  for (const user of [buyer, admin])
    await assert.rejects(createProduct(user, details), { status: 403 });
  await assert.rejects(createProduct(null, details), { status: 401 });
});
test("Create derives farmer from the authenticated session and stores no binary images", async (t) => {
  let persisted;
  t.mock.method(Product, "create", async (value) => {
    persisted = value;
    return { ...value, _id: "507f1f77bcf86cd799439099" };
  });
  const result = await createProduct(farmerA, details);
  assert.equal(result.farmer, farmerA.id);
  assert.deepEqual(persisted.images, []);
});
test("Other farmer update and delete are rejected before any writes", async (t) => {
  const product = record();
  t.mock.method(Product, "findById", async () => product);
  const save = t.mock.method(product, "save", async () => product);
  const remove = t.mock.method(Product, "deleteOne", async () => ({
    deletedCount: 1,
  }));
  await assert.rejects(
    updateProduct(String(product._id), farmerB, { price: 30 }),
    { status: 403 },
  );
  await assert.rejects(deleteProduct(String(product._id), farmerB), {
    status: 403,
  });
  assert.equal(save.mock.callCount(), 0);
  assert.equal(remove.mock.callCount(), 0);
});
test("Owner update preserves fields, validates merged stock, derives out-of-stock and restock status", async (t) => {
  const product = record();
  t.mock.method(Product, "findById", async () => product);
  t.mock.method(product, "save", async () => {
    await product.validate();
    return product;
  });
  await assert.rejects(
    updateProduct(String(product._id), farmerA, { availableQuantity: 0.5 }),
    { status: 400 },
  );
  let result = await updateProduct(String(product._id), farmerA, {
    availableQuantity: 0,
  });
  assert.equal(result.product.status, "OUT_OF_STOCK");
  assert.equal(result.product.name, details.name);
  result = await updateProduct(String(product._id), farmerA, {
    availableQuantity: 12,
  });
  assert.equal(result.product.status, "ACTIVE");
  assert.equal(result.product.minimumOrderQuantity, 1);
});
test("Update rejects attachment of an image not already owned by the product", async (t) => {
  const product = record();
  t.mock.method(Product, "findById", async () => product);
  await assert.rejects(
    updateProduct(
      String(product._id),
      farmerA,
      { price: 30 },
      [],
      ["farmdirect/products/other/image"],
    ),
    { status: 403 },
  );
});
test("Owner deletion binds the write to owner and record version", async (t) => {
  const product = record();
  product.__v = 2;
  t.mock.method(Product, "findById", async () => product);
  let predicate;
  t.mock.method(Product, "deleteOne", async (value) => {
    predicate = value;
    return { deletedCount: 1 };
  });
  assert.deepEqual(await deleteProduct(String(product._id), farmerA), {
    cleanupFailed: false,
  });
  assert.equal(predicate.farmer, farmerA.id);
  assert.equal(predicate.__v, 2);
});
test("The model enforces zero-stock status and minimum order even outside service writes", async () => {
  const product = new Product({
    ...details,
    farmer: farmerA.id,
    availableQuantity: 0,
    status: "DISABLED",
  });
  await product.validate();
  assert.equal(product.status, "OUT_OF_STOCK");
  product.availableQuantity = 0.5;
  await assert.rejects(product.validate());
});
test("Stock helpers and Indian price formatting are consistent", () => {
  assert.equal(productStatus(0, "DISABLED"), "OUT_OF_STOCK");
  assert.equal(productStatus(20, "OUT_OF_STOCK"), "ACTIVE");
  assert.equal(productStatus(20, "DISABLED"), "DISABLED");
  assert.equal(formatCurrency(2500), "₹2,500.00");
});
