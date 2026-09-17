import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
}, { timestamps: true });

export default mongoose.models.Wishlist || mongoose.model("Wishlist", wishlistSchema);
