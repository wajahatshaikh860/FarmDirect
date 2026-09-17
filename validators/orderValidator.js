import { z } from "zod";
import { ORDER_STATUSES } from "../lib/commerce.js";
export const shippingAddressSchema = z
  .object({
    fullName: z.string().trim().min(2).max(100),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian phone number"),
    addressLine1: z.string().trim().min(5).max(200),
    addressLine2: z.string().trim().max(200).optional().default(""),
    villageOrCity: z.string().trim().min(2).max(100),
    district: z.string().trim().min(2).max(100),
    state: z.string().trim().min(2).max(100),
    postalCode: z
      .string()
      .regex(/^[1-9]\d{5}$/, "Enter a valid six-digit postal code"),
  })
  .strict();
export const checkoutSchema = z
  .object({
    shippingAddress: shippingAddressSchema,
    paymentMethod: z.enum(["COD", "RAZORPAY"]),
    requestId: z.string().uuid(),
  })
  .strict();
export const statusSchema = z
  .object({ status: z.enum(ORDER_STATUSES) })
  .strict();
export const paymentVerificationSchema = z
  .object({
    razorpay_order_id: z.string().regex(/^order_[A-Za-z0-9]+$/),
    razorpay_payment_id: z.string().regex(/^pay_[A-Za-z0-9]+$/),
    razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/i),
  })
  .strict();
