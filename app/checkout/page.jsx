import { requireRole } from "@/lib/permissions";
import { getCart } from "@/services/cartService";
import { razorpayConfigured } from "@/lib/razorpay";
import CommerceShell from "@/components/commerce/CommerceShell";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import Button from "@/components/ui/Button";
export const metadata = { title: "Checkout" };
export default async function Page() {
  const user = await requireRole("BUYER");
  const cart = await getCart(user);
  return (
    <CommerceShell activeLabel="Cart">
      <header className="commerce-heading">
        <span className="eyebrow">DIRECT FROM FARM TO YOU</span>
        <h1>Checkout</h1>
      </header>
      {cart.canCheckout ? (
        <CheckoutForm
          cart={cart}
          user={user}
          razorpayAvailable={razorpayConfigured()}
        />
      ) : (
        <div className="commerce-panel commerce-empty">
          <h2>
            {cart.items.length
              ? "Your cart needs an update."
              : "Your cart is empty."}
          </h2>
          <p>Check product availability and quantity before checkout.</p>
          <Button href="/cart">Back to Cart</Button>
        </div>
      )}
    </CommerceShell>
  );
}
