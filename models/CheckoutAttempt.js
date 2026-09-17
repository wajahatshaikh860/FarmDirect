import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    requestId: { type: String, required: true },
    paymentMethod: { type: String, enum: ["COD", "RAZORPAY"], required: true },
    status: {
      type: String,
      enum: ["CREATING", "READY", "FAILED", "COMPLETED"],
      required: true,
    },
    amountPaise: { type: Number, required: true },
    cartVersion: Number,
    items: {
      type: [
        new mongoose.Schema(
          {
            product: mongoose.Schema.Types.ObjectId,
            farmer: mongoose.Schema.Types.ObjectId,
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
      required: true,
    },
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
    razorpayOrderId: String,
    razorpayPaymentId: String,
    verifiedAt: Date,
    orderIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
  },
  { timestamps: true },
);
schema.index({ buyer: 1, requestId: 1 }, { unique: true });
schema.index(
  { razorpayOrderId: 1 },
  {
    unique: true,
    partialFilterExpression: { razorpayOrderId: { $type: "string" } },
  },
);
schema.index(
  { razorpayPaymentId: 1 },
  {
    unique: true,
    partialFilterExpression: { razorpayPaymentId: { $type: "string" } },
  },
);
export default mongoose.models.CheckoutAttempt ||
  mongoose.model("CheckoutAttempt", schema);
