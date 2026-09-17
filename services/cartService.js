import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import "../models/User.js";
import { connectDB } from "../lib/db.js";
import { requireProductRole } from "../lib/productPermissions.js";
import { ProductError } from "../lib/productErrors.js";
import {
  assertQuantity,
  linePaise,
  serializeCommerce,
  parseCommerce,
} from "../lib/commerce.js";
import { cartItemSchema, objectId } from "../validators/cartValidator.js";
import { commerceTransaction } from "../lib/commerceTransaction.js";
export async function getCart(user) {
  requireProductRole(user, ["BUYER"]);
  await connectDB();
  const cart = await Cart.findOne({ buyer: user.id }).lean();
  if (!cart) return { items: [], subtotal: 0, canCheckout: false };
  const products = await Product.find({
    _id: { $in: cart.items.map((item) => item.product) },
  })
    .populate("farmer", "name role accountStatus")
    .lean();
  const map = new Map(products.map((p) => [String(p._id), p]));
  const items = cart.items.map((item) => {
    const product = map.get(String(item.product));
    let error = "";
    try {
      assertQuantity(product, item.quantity);
      if (!product.farmer || product.farmer.accountStatus !== "ACTIVE")
        throw new Error();
    } catch (e) {
      error = e instanceof ProductError ? e.message : "Farmer unavailable";
    }
    return {
      productId: String(item.product),
      quantity: item.quantity,
      product: product ? serializeCommerce(product) : null,
      error,
      lineTotal: product ? linePaise(product.price, item.quantity) / 100 : 0,
    };
  });
  return {
    items,
    subtotal:
      items.reduce((sum, item) => sum + Math.round(item.lineTotal * 100), 0) /
      100,
    canCheckout: items.length > 0 && items.every((item) => !item.error),
  };
}
export async function setCartItem(user, input) {
  requireProductRole(user, ["BUYER"]);
  const { productId, quantity } = parseCommerce(cartItemSchema, input);
  await commerceTransaction(async (session) => {
    const product = await Product.findById(productId).session(session);
    assertQuantity(product, quantity);
    let cart = await Cart.findOne({ buyer: user.id }).session(session);
    cart ||= new Cart({ buyer: user.id, items: [] });
    const existing = cart.items.find(
      (item) => String(item.product) === productId,
    );
    if (existing) existing.quantity = quantity;
    else {
      if (cart.items.length >= 100)
        throw new ProductError("Cart has reached its item limit", 400);
      cart.items.push({ product: productId, quantity });
    }
    await cart.save({ session });
  });
  return getCart(user);
}
export async function removeCartItem(user, productId) {
  requireProductRole(user, ["BUYER"]);
  parseCommerce(objectId, productId);
  await commerceTransaction(async (session) => {
    const cart = await Cart.findOne({ buyer: user.id }).session(session);
    if (cart) {
      cart.items = cart.items.filter(
        (item) => String(item.product) !== productId,
      );
      await cart.save({ session });
    }
  });
  return getCart(user);
}
export async function clearCart(user) {
  requireProductRole(user, ["BUYER"]);
  await commerceTransaction(async (session) => {
    const cart = await Cart.findOne({ buyer: user.id }).session(session);
    if (cart) {
      cart.items = [];
      await cart.save({ session });
    }
  });
  return getCart(user);
}
