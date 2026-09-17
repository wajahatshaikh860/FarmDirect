import mongoose from "mongoose";
import { connectDB } from "./db.js";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import CheckoutAttempt from "../models/CheckoutAttempt.js";
let ready;
export async function commerceTransaction(callback) {
  await connectDB();
  // Create collections/indexes before first multi-document transaction.
  ready ??= Promise.all([
    Cart.init(),
    Order.init(),
    CheckoutAttempt.init(),
  ]).catch((error) => {
    ready = undefined;
    throw error;
  });
  await ready;
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(() => callback(session));
  } finally {
    await session.endSession();
  }
}
