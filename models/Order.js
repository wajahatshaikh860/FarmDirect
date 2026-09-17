import mongoose from "mongoose";
import { ORDER_STATUSES } from "../lib/commerce.js";
const schema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    checkout: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CheckoutAttempt",
      required: true,
    },
    items: [
      new mongoose.Schema(
        {
          product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
          },
          productName: String,
          productImage: String,
          category: String,
          unit: String,
          priceAtOrder: Number,
          quantity: Number,
          lineTotal: Number,
        },
        { _id: false },
      ),
    ],
    shippingAddress: {
      fullName: String,
      phone: String,
      addressLine1: String,
      addressLine2: String,
      villageOrCity: String,
      district: String,
      state: String,
      postalCode: String,
    },
    subtotal: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ["COD", "RAZORPAY"], required: true },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      required: true,
    },
    orderStatus: { type: String, enum: ORDER_STATUSES, default: "PENDING" },
    razorpay: { orderId: String, paymentId: String, verifiedAt: Date },
    inventoryRestored: { type: Boolean, default: false },
    statusHistory: [
      new mongoose.Schema(
        {
          status: { type: String, enum: ORDER_STATUSES },
          changedAt: { type: Date, default: Date.now },
          changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        },
        { _id: false },
      ),
    ],
  },
  { timestamps: true, optimisticConcurrency: true },
);
schema.index({ buyer: 1, createdAt: -1 });
schema.index({ farmer: 1, createdAt: -1 });
schema.index({ checkout: 1, farmer: 1 }, { unique: true });
export default mongoose.models.Order || mongoose.model("Order", schema);
