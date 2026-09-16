import User from "../models/User.js";
export async function getUserCounts() {
  const [users, farmers, buyers] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "FARMER" }),
    User.countDocuments({ role: "BUYER" }),
  ]);
  return { users, farmers, buyers };
}
