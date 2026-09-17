import { notFound } from "next/navigation";
import { requireRole } from "@/lib/permissions";
import { getOrder } from "@/services/orderService";
import { ProductError } from "@/lib/productErrors";
import CommerceShell from "@/components/commerce/CommerceShell";
import { OrderDetail } from "@/components/order/OrderViews";
export const metadata = { title: "Order Details" };
export default async function Page({ params }) {
  const user = await requireRole("FARMER");
  let order;
  try {
    order = await getOrder(user, (await params).id, "FARMER");
  } catch (e) {
    if (e instanceof ProductError && [403, 404].includes(e.status)) notFound();
    throw e;
  }
  return (
    <CommerceShell role="FARMER" activeLabel="Orders">
      <OrderDetail order={order} role="FARMER" />
    </CommerceShell>
  );
}
