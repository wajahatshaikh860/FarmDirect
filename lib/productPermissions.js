import { getServerSession } from "next-auth";
import { authOptions } from "./auth.js";
import { ProductError } from "./productErrors.js";
// API guards share the frozen Phase 1 session configuration.
export async function requireProductUser(roles = ["FARMER"]) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new ProductError("Unauthorized", 401);
  requireProductRole(session.user, roles);
  return session.user;
}
export function requireProductRole(user, roles = ["FARMER"]) {
  if (!user?.id) throw new ProductError("Unauthorized", 401);
  if (!roles.includes(user.role)) throw new ProductError("Forbidden", 403);
}
export function requireProductOwner(user, product) {
  requireProductRole(user, ["FARMER", "ADMIN"]);
  const owner = String(product.farmer?._id || product.farmer);
  if (user.role !== "ADMIN" && owner !== String(user.id))
    throw new ProductError(
      "You do not have permission to manage this product",
      403,
    );
}
