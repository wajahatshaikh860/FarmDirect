import { requireRole } from "@/lib/permissions";
import { getOrders } from "@/services/orderService";
import CommerceShell from "@/components/commerce/CommerceShell";
import { OrderList } from "@/components/order/OrderViews";
export const metadata = { title: "My Orders" };
export default async function Page({ searchParams }) {
  const user = await requireRole("BUYER");
  const result = await getOrders(user, "BUYER", (await searchParams).page);
  return (
    <CommerceShell role="BUYER" activeLabel="My Orders">
      <header className="commerce-heading">
        <span className="eyebrow">YOUR FARM ORDERS</span>
        <h1>My Orders</h1>
      </header>
      <OrderList result={result} role="BUYER" />
    </CommerceShell>
  );
}
