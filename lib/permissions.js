import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./auth.js";
import { dashboardFor } from "./constants.js";
export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  return session.user;
}
export async function requireRole(role) {
  const user = await requireAuth();
  if (user.role !== role)
    redirect(`${dashboardFor(user.role)}?error=unauthorized`);
  return user;
}
