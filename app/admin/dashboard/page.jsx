import { requireRole } from "@/lib/permissions";
import Dashboard from "@/components/dashboard/Dashboard";
import { getUserCounts } from "@/services/userService";
export default async function Page() {
  const user = await requireRole("ADMIN");
  const counts = await getUserCounts();
  return <Dashboard user={user} counts={counts} />;
}
