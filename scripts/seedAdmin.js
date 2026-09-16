import dns from "node:dns";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { passwordSchema } from "../lib/validators.js";

// IMPORTANT:
// Configure DNS BEFORE loading Mongoose / MongoDB related modules.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

console.log("🌐 Seed DNS configured:", dns.getServers());

// Mongo-related modules are loaded only after DNS is configured.
const mongoose = (await import("mongoose")).default;

const {
  connectDB,
  safeServerErrorMessage,
} = await import("../lib/db.js");

const User = (await import("../models/User.js")).default;

try {
  const email = z
    .string()
    .trim()
    .toLowerCase()
    .email()
    .parse(process.env.ADMIN_EMAIL);

  const password = passwordSchema.parse(
    process.env.ADMIN_PASSWORD
  );

  await connectDB();

  await User.init();

  if (await User.exists({ email })) {
    throw new Error(
      "Email already exists; refusing to overwrite or promote an account"
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await User.create({
    name: "FarmDirect Admin",
    email,
    phone: "Not provided",
    role: "ADMIN",
    passwordHash,
    verificationStatus: "VERIFIED",
  });

  console.log("✅ Admin account created successfully");
} catch (error) {
  console.error("❌ Admin seed failed");
  console.error(safeServerErrorMessage(error));

  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}