import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";
import { connectDB } from "../lib/db.js";
import { requireProductRole } from "../lib/productPermissions.js";
import { ProductError } from "../lib/productErrors.js";
import { parseCommerce, serializeCommerce } from "../lib/commerce.js";
import { objectId } from "../validators/cartValidator.js";

function requireBuyer(user) { requireProductRole(user, ["BUYER"]); }
export async function getWishlist(user) {
  requireBuyer(user); await connectDB();
  const wishlist = await Wishlist.findOne({ buyer: user.id }).populate({ path: "products", populate: { path: "farmer", select: "name verificationStatus" } }).lean();
  return serializeCommerce({ products: wishlist?.products?.filter(Boolean) || [] });
}
export async function wishlistProductIds(user) {
  requireBuyer(user); await connectDB();
  const wishlist = await Wishlist.findOne({ buyer: user.id }).select("products").lean();
  return (wishlist?.products || []).map(String);
}
export async function addWishlistProduct(user, productId) {
  requireBuyer(user); parseCommerce(objectId, productId); await connectDB();
  if (!(await Product.exists({ _id: productId }))) throw new ProductError("Product not found", 404);
  await Wishlist.updateOne({ buyer: user.id }, { $setOnInsert: { buyer: user.id }, $addToSet: { products: productId } }, { upsert: true });
  return { saved: true, productId: String(productId) };
}
export async function removeWishlistProduct(user, productId) {
  requireBuyer(user); parseCommerce(objectId, productId); await connectDB();
  await Wishlist.updateOne({ buyer: user.id }, { $pull: { products: productId } });
  return { saved: false, productId: String(productId) };
}
