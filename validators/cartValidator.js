import { z } from "zod";
export const objectId = z
  .string()
  .regex(/^[a-f0-9]{24}$/i, "Invalid product or order ID");
export const quantitySchema = z
  .number()
  .finite()
  .positive()
  .max(1000000000)
  .refine(
    (value) => Math.abs(value * 1000 - Math.round(value * 1000)) < 0.000001,
    "Use at most three decimal places",
  );
export const cartItemSchema = z
  .object({ productId: objectId, quantity: quantitySchema })
  .strict();
export const cartQuantitySchema = z
  .object({ quantity: quantitySchema })
  .strict();
