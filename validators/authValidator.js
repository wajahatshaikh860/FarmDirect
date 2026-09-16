import { z } from "zod";
import { SIGNUP_ROLES, FARMING_TYPES } from "../lib/constants.js";
export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .refine(
    (v) => Buffer.byteLength(v, "utf8") <= 72,
    "Password must be at most 72 bytes",
  );
const email = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email")
  .max(254);
export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128),
});
export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name").max(100),
    email,
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9 ()-]{10,20}$/, "Enter a valid phone number")
      .refine(
        (v) => v.replace(/\D/g, "").length >= 10,
        "Enter at least 10 digits",
      ),
    password: passwordSchema,
    confirmPassword: z.string(),
    role: z.enum(SIGNUP_ROLES),
    farmName: z.string().trim().max(100).optional(),
    district: z.string().trim().max(100).optional(),
    state: z.string().trim().max(100).optional(),
    farmingType: z.enum(FARMING_TYPES).optional(),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (v.password !== v.confirmPassword)
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    if (v.role === "FARMER")
      for (const key of ["farmName", "district", "state", "farmingType"])
        if (!v[key])
          ctx.addIssue({
            code: "custom",
            path: [key],
            message: "This field is required for farmers",
          });
  });
