import { requireRole } from "@/lib/permissions";
import { getCart } from "@/services/cartService";
import CommerceShell from "@/components/commerce/CommerceShell";
import CartView from "@/components/cart/CartView";
export const metadata = { title: "Your Cart" };
export default async function Page() {
  const user = await requireRole("BUYER");
  return (
    <CommerceShell activeLabel="Cart">
      <header className="commerce-heading">
        <span className="eyebrow">FRESH FROM THE SOURCE</span>
        <h1>Your Cart</h1>
      </header>
      <CartView initialCart={await getCart(user)} />
    </CommerceShell>
  );
}
