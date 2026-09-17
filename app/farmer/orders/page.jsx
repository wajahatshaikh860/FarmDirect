import { requireRole } from "@/lib/permissions";
import { getOrders } from "@/services/orderService";
import CommerceShell from "@/components/commerce/CommerceShell";
import { OrderList } from "@/components/order/OrderViews";
export const metadata = { title: "Incoming Orders" };
export default async function Page({ searchParams }) {
  const user = await requireRole("FARMER");
  const result = await getOrders(user, "FARMER", (await searchParams).page);
  return (
    <CommerceShell role="FARMER" activeLabel="Orders">
      <header className="commerce-heading">
        <span className="eyebrow">YOUR FARM ORDERS</span>
        <h1>Incoming Orders</h1>
      </header>
      <OrderList result={result} role="FARMER" />
    </CommerceShell>
  );
}
