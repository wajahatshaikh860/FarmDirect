import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: {
      type: [
        new mongoose.Schema(
          {
            product: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Product",
              required: true,
            },
            quantity: { type: Number, required: true, min: 0.001 },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
  },
  { timestamps: true, optimisticConcurrency: true },
);
export default mongoose.models.Cart || mongoose.model("Cart", schema);
