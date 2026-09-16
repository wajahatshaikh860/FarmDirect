import { z } from "zod";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_UNITS,
  PRODUCT_GRADES,
  PRODUCT_FARMING_TYPES,
  PRODUCT_STATUSES,
  PRODUCT_SORTS,
  MAX_PRODUCT_IMAGES,
} from "../lib/constants.js";
const numeric = (schema) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() !== "" ? Number(value) : value,
    schema.finite(),
  );
const date = z.preprocess(
  (value) => (value === "" || value == null ? undefined : value),
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid harvest date")
    .refine((value) => {
      const parsed = new Date(value);
      return (
        !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === value
      );
    }, "Enter a valid harvest date")
    .optional(),
);
export const productFieldsSchema = z
  .object({
    name: z.string().trim().min(2, "Enter a product name").max(120),
    category: z.enum(PRODUCT_CATEGORIES),
    description: z
      .string()
      .trim()
      .min(10, "Use at least 10 characters")
      .max(3000),
    price: numeric(z.number().positive("Price must be greater than zero")),
    unit: z.enum(PRODUCT_UNITS),
    availableQuantity: numeric(
      z.number().nonnegative("Stock cannot be negative"),
    ),
    minimumOrderQuantity: numeric(
      z.number().positive("Minimum order must be greater than zero"),
    ),
    harvestDate: date,
    qualityGrade: z.enum(PRODUCT_GRADES),
    farmingType: z.enum(PRODUCT_FARMING_TYPES),
    location: z
      .object({
        village: z.string().trim().max(100).optional(),
        district: z.string().trim().min(2, "Enter a district").max(100),
        state: z.string().trim().min(2, "Enter a state").max(100),
      })
      .strict(),
    status: z.enum(PRODUCT_STATUSES).default("ACTIVE"),
  })
  .strict();
export const productSchema = productFieldsSchema.superRefine(
  (value, context) => {
    if (
      value.availableQuantity > 0 &&
      value.minimumOrderQuantity > value.availableQuantity
    )
      context.addIssue({
        code: "custom",
        path: ["minimumOrderQuantity"],
        message: "Minimum order cannot exceed available stock",
      });
  },
);
export const productPatchSchema = productFieldsSchema
  .extend({ status: z.enum(PRODUCT_STATUSES).optional() })
  .partial();
export const retainedImagesSchema = z
  .array(z.string().min(1).max(300))
  .max(MAX_PRODUCT_IMAGES)
  .refine(
    (ids) => new Set(ids).size === ids.length,
    "Duplicate images are not allowed",
  );
const optionalNumber = z.preprocess(
  (value) => (value === "" || value == null ? undefined : Number(value)),
  z.number().finite().nonnegative().optional(),
);
const optionalEnum = (values) =>
  z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.enum(values).optional(),
  );
export const productQuerySchema = z
  .object({
    q: z.string().trim().max(100).optional(),
    category: optionalEnum(PRODUCT_CATEGORIES),
    minPrice: optionalNumber,
    maxPrice: optionalNumber,
    farmingType: optionalEnum(PRODUCT_FARMING_TYPES),
    qualityGrade: optionalEnum(PRODUCT_GRADES),
    state: z.string().trim().max(100).optional(),
    district: z.string().trim().max(100).optional(),
    availability: z
      .enum(["in-stock", "out-of-stock", "all"])
      .default("in-stock"),
    sort: z.enum(PRODUCT_SORTS).default("newest"),
    page: z.coerce.number().int().min(1).max(10000).default(1),
  })
  .superRefine((value, context) => {
    if (
      value.minPrice != null &&
      value.maxPrice != null &&
      value.minPrice > value.maxPrice
    )
      context.addIssue({
        code: "custom",
        path: ["maxPrice"],
        message: "Maximum price must be at least the minimum price",
      });
  });
