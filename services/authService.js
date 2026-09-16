import bcrypt from "bcryptjs";
import { connectDB, safeServerErrorMessage } from "../lib/db.js";
import User from "../models/User.js";
import { loginSchema } from "../validators/authValidator.js";
export async function authenticate(credentials) {
  const parsed = loginSchema.safeParse(credentials);
  if (!parsed.success) {
    if (process.env.NODE_ENV === "development")
      console.warn("Credentials login rejected: invalid email/password fields");
    return null;
  }
  let user;
  try {
    await connectDB();
    user = await User.findOne({ email: parsed.data.email }).select(
      "+passwordHash",
    );
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("❌ Credentials login unavailable");
      console.error("Message: " + safeServerErrorMessage(error));
    }
    throw new Error("Login is temporarily unavailable");
  }
  if (!user) {
    if (process.env.NODE_ENV === "development")
      console.warn("Credentials login rejected: user not found");
    return null;
  }
  if (!(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    if (process.env.NODE_ENV === "development")
      console.warn("Credentials login rejected: password comparison failed");
    return null;
  }
  if (user.accountStatus !== "ACTIVE") {
    if (process.env.NODE_ENV === "development")
      console.warn("Credentials login rejected: account suspended");
    throw new Error("Account suspended");
  }
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

// Called only after registerSchema has validated and normalized the payload.
export async function registerAccount(details) {
  await connectDB();
  await User.init();
  if (await User.exists({ email: details.email })) return false;
  await User.create({
    name: details.name,
    email: details.email,
    phone: details.phone,
    role: details.role,
    passwordHash: await bcrypt.hash(details.password, 12),
    ...(details.role === "FARMER"
      ? {
          address: { district: details.district, state: details.state },
          farmerProfile: {
            farmName: details.farmName,
            farmingType: details.farmingType,
          },
        }
      : {}),
  });

  return true;
}
