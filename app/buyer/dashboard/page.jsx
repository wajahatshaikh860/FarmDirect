import { requireRole } from "@/lib/permissions";
import Dashboard from "@/components/dashboard/Dashboard";
export default async function Page() {
  return <Dashboard user={await requireRole("BUYER")} />;
}
