import { publicProduct } from "../lib/farmLocation.js";
import Product from "../models/Product.js";
import "../models/User.js";
import { connectDB } from "../lib/db.js";
import {
  productSchema,
  productPatchSchema,
  productQuerySchema,
} from "../validators/productValidator.js";
import { ProductError, validationError } from "../lib/productErrors.js";
import {
  requireProductRole,
  requireProductOwner,
} from "../lib/productPermissions.js";
import {
  uploadProductImages,
  cleanupProductImages,
} from "../lib/cloudinary.js";
import { MAX_PRODUCT_IMAGES } from "../lib/constants.js";
import { productStatus } from "../lib/productUtils.js";
const FARMER_FIELDS = "name farmerProfile address verificationStatus",
  PAGE_SIZE = 24;
export const serializeProduct = (product) =>
  JSON.parse(JSON.stringify(product));
function parse(schema, values) {
  const parsed = schema.safeParse(values);
  if (!parsed.success) throw validationError(parsed.error);
  return parsed.data;
}
function validId(id) {
  if (typeof id !== "string" || !/^[a-f0-9]{24}$/i.test(id))
    throw new ProductError("Product not found", 404);
}
export function allowedProductFields(value) {
  return {
    name: value.name,
    category: value.category,
    description: value.description,
    price: value.price,
    unit: value.unit,
    availableQuantity: value.availableQuantity,
    minimumOrderQuantity: value.minimumOrderQuantity,
    harvestDate: value.harvestDate || undefined,
    qualityGrade: value.qualityGrade,
    farmingType: value.farmingType,
    location: {
      addressLine: value.location.addressLine,
      postalCode: value.location.postalCode,
      latitude: value.location.latitude,
      longitude: value.location.longitude,
      village: value.location.village || "",
      district: value.location.district,
      state: value.location.state,
    },
    status: productStatus(value.availableQuantity, value.status),
  };
}
export function escapeProductSearch(value) {
  return value.replace(/[.*+?^$(){}|[\]\\]/g, "\\$&");
}
export function buildProductQuery(input = {}) {
  const filters = parse(productQuerySchema, input);
  const query = {
    status:
      filters.availability === "all"
        ? { $in: ["ACTIVE", "OUT_OF_STOCK"] }
        : filters.availability === "out-of-stock"
          ? "OUT_OF_STOCK"
          : "ACTIVE",
  };
  for (const key of ["category", "farmingType", "qualityGrade"])
    if (filters[key]) query[key] = filters[key];
  if (filters.minPrice != null || filters.maxPrice != null)
    query.price = {
      ...(filters.minPrice != null ? { $gte: filters.minPrice } : {}),
      ...(filters.maxPrice != null ? { $lte: filters.maxPrice } : {}),
    };
  for (const key of ["state", "district"])
    if (filters[key])
      query["location." + key] = new RegExp(
        "^" + escapeProductSearch(filters[key]) + "$",
        "i",
      );
  if (filters.q) {
    const regex = new RegExp(escapeProductSearch(filters.q), "i");
    query.$or = ["name", "category", "location.district", "location.state"].map(
      (key) => ({ [key]: regex }),
    );
  }
  const sort =
    filters.sort === "price-asc"
      ? { price: 1, _id: 1 }
      : filters.sort === "price-desc"
        ? { price: -1, _id: 1 }
        : { createdAt: -1, _id: -1 };
  return { filters, query, sort };
}
export async function getProducts(input = {}) {
  const { filters, query, sort } = buildProductQuery(input);
  await connectDB();
  const [products, total] = await Promise.all([
    Product.find(query)
      .populate("farmer", FARMER_FIELDS)
      .sort(sort)
      .skip((filters.page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    Product.countDocuments(query),
  ]);
  return {
    products: products.map(publicProduct),
    total,
    page: filters.page,
    pages: Math.ceil(total / PAGE_SIZE),
    filters,
  };
}
export async function getFarmerProducts(user, page = 1) {
  requireProductRole(user);
  const pageNumber = parse(productQuerySchema, { page }).page;
  await connectDB();
  const query = { farmer: user.id };
  const [products, total] = await Promise.all([
    Product.find(query)
      .populate("farmer", FARMER_FIELDS)
      .sort({ createdAt: -1, _id: -1 })
      .skip((pageNumber - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    Product.countDocuments(query),
  ]);
  return {
    products: serializeProduct(products),
    total,
    page: pageNumber,
    pages: Math.ceil(total / PAGE_SIZE),
  };
}
export async function getProductById(id, user) {
  validId(id);
  await connectDB();
  const product = await Product.findById(id)
    .populate("farmer", FARMER_FIELDS)
    .lean();
  if (!product) throw new ProductError("Product not found", 404);
  if (product.status === "DISABLED") {
    if (!user) throw new ProductError("Product not found", 404);
    try {
      requireProductOwner(user, product);
    } catch {
      throw new ProductError("Product not found", 404);
    }
  }
  const owner = String(product.farmer?._id || product.farmer);
  return user && (user.role === "ADMIN" || user.id === owner) ? serializeProduct(product) : publicProduct(product);
}
export async function getProductForManagement(id, user) {
  requireProductRole(user, ["FARMER", "ADMIN"]);
  validId(id);
  await connectDB();
  const product = await Product.findById(id);
  if (!product) throw new ProductError("Product not found", 404);
  requireProductOwner(user, product);
  return product;
}
export async function createProduct(user, fields, files = [], retainedImages) {
  requireProductRole(user);
  if (retainedImages?.length)
    throw new ProductError("New products cannot reuse unrelated images", 400);
  const details = allowedProductFields(parse(productSchema, fields));
  await connectDB();
  const images = await uploadProductImages(files, user.id);
  try {
    return serializeProduct(
      await Product.create({ ...details, farmer: user.id, images }),
    );
  } catch (error) {
    await cleanupProductImages(images, user.id);
    throw error;
  }
}
export async function updateProduct(
  id,
  user,
  fields,
  files = [],
  retainedImages,
) {
  const product = await getProductForManagement(id, user),
    patch = parse(productPatchSchema, fields),
    current = product.toObject(),
    complete = {};
  // Validate the whole merged record so partial stock updates cannot violate order limits.
  for (const key of Object.keys(productSchema.shape))
    complete[key] = current[key];
  complete.harvestDate = current.harvestDate?.toISOString().slice(0, 10);
  const details = allowedProductFields(
    parse(productSchema, { ...complete, ...patch }),
  );
  const retained =
    retainedImages === undefined
      ? product.images.map((image) => image.publicId)
      : retainedImages;
  const keep = product.images.filter((image) =>
    retained.includes(image.publicId),
  );
  if (keep.length !== retained.length)
    throw new ProductError("An image does not belong to this product", 403);
  if (keep.length + files.length > MAX_PRODUCT_IMAGES)
    throw new ProductError("Use up to five product images", 400);
  const ownerId = String(product.farmer),
    uploaded = await uploadProductImages(files, ownerId);
  const obsolete = product.images
    .filter((image) => !retained.includes(image.publicId))
    .map((image) => ({ publicId: image.publicId }));
  try {
    product.set({
      ...details,
      images: [
        ...keep.map((image) => ({ url: image.url, publicId: image.publicId })),
        ...uploaded,
      ],
    });
    await product.save();
  } catch (error) {
    await cleanupProductImages(uploaded, ownerId);
    throw error;
  }
  return {
    product: serializeProduct(product),
    cleanupFailed: await cleanupProductImages(obsolete, ownerId),
  };
}
export async function deleteProduct(id, user) {
  const product = await getProductForManagement(id, user);
  const result = await Product.deleteOne({
    _id: product._id,
    ...(user.role === "ADMIN" ? {} : { farmer: user.id }),
    __v: product.__v,
  });
  if (result.deletedCount !== 1)
    throw new ProductError("This product changed. Refresh and try again.", 409);
  return {
    cleanupFailed: await cleanupProductImages(
      product.images,
      String(product.farmer),
    ),
  };
}
