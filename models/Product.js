import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_UNITS,
  PRODUCT_GRADES,
  PRODUCT_FARMING_TYPES,
  PRODUCT_STATUSES,
  MAX_PRODUCT_IMAGES,
} from "../lib/constants.js";
import { productStatus } from "../lib/productUtils.js";
const positive = (value) => Number.isFinite(value) && value > 0;
const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false },
);
const productSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: {
      type: String,
      unique: true,
      default: function () {
        return (
          (this.name || "produce")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
            .slice(0, 80) +
          "-" +
          randomUUID()
        );
      },
    },
    category: { type: String, enum: PRODUCT_CATEGORIES, required: true },
    description: { type: String, required: true, trim: true, maxlength: 3000 },
    images: {
      type: [imageSchema],
      default: [],
      validate: (value) => value.length <= MAX_PRODUCT_IMAGES,
    },
    price: { type: Number, required: true, validate: positive },
    unit: { type: String, enum: PRODUCT_UNITS, required: true },
    availableQuantity: {
      type: Number,
      required: true,
      min: 0,
      validate: Number.isFinite,
    },
    minimumOrderQuantity: {
      type: Number,
      required: true,
      validate: {
        validator: function (value) {
          return (
            positive(value) &&
            (this.availableQuantity === 0 || value <= this.availableQuantity)
          );
        },
        message: "Minimum order must fit available stock",
      },
    },
    harvestDate: Date,
    qualityGrade: { type: String, enum: PRODUCT_GRADES, required: true },
    farmingType: { type: String, enum: PRODUCT_FARMING_TYPES, required: true },
    location: {
      village: { type: String, trim: true, maxlength: 100 },
      district: { type: String, required: true, trim: true, maxlength: 100 },
      state: { type: String, required: true, trim: true, maxlength: 100 },
    },
    status: {
      type: String,
      enum: PRODUCT_STATUSES,
      default: "ACTIVE",
      required: true,
    },
  },
  { timestamps: true, optimisticConcurrency: true },
);
productSchema.pre("validate", function () {
  this.status = productStatus(this.availableQuantity, this.status);
});
productSchema.index({ farmer: 1, createdAt: -1 });
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ category: 1, status: 1, price: 1 });
export default mongoose.models.Product ||
  mongoose.model("Product", productSchema);
