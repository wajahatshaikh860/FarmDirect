import Button from "@/components/ui/Button";
import { formatCurrency, unitLabel } from "@/lib/productUtils";
import ProductImage from "@/components/product/ProductImage";
import OrderTimeline from "./OrderTimeline";
import FarmerOrderActions from "./FarmerOrderActions";
export function OrderBadge({ status }) {
  return (
    <span
      className={
        "commerce-badge " + (status === "CANCELLED" ? "cancelled" : "")
      }
    >
      {status}
    </span>
  );
}
export function OrderItems({ items }) {
  return (
    <ul className="commerce-order-items">
      {items.map((item) => (
        <li key={item.product} className="commerce-order-line">
          <div className="commerce-item-image">
            <ProductImage src={item.productImage} alt={item.productName} />
          </div>
          <div>
            <strong>{item.productName}</strong>
            <div className="commerce-row">
              <span>
                {item.quantity} {unitLabel(item.unit)} ×{" "}
                {formatCurrency(item.priceAtOrder)} · {item.category}
              </span>
              <strong>{formatCurrency(item.lineTotal)}</strong>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
export function OrderList({ result, role }) {
  const base = role === "BUYER" ? "/buyer/orders" : "/farmer/orders";
  if (!result.orders.length)
    return (
      <div className="commerce-panel commerce-empty">
        <h2>
          {role === "BUYER"
            ? "You haven’t placed any orders yet."
            : "No orders received yet."}
        </h2>
        {role === "BUYER" && (
          <Button href="/marketplace">Browse Marketplace</Button>
        )}
      </div>
    );
  return (
    <>
      <div>
        {result.orders.map((order) => (
          <article
            className="commerce-panel commerce-order-card"
            key={order._id}
          >
            <div className="commerce-row">
              <h2>Order #{order._id.slice(-8).toUpperCase()}</h2>
              <OrderBadge status={order.orderStatus} />
            </div>
            <p>
              {role === "BUYER"
                ? "Farmer: " + (order.farmer?.name || "Unavailable")
                : "Buyer: " + (order.buyer?.name || "Unavailable")}
            </p>
            <p className="muted">
              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                timeZone: "Asia/Kolkata",
              })}
            </p>
            <OrderItems items={order.items} />
            <div className="commerce-row">
              <strong>{formatCurrency(order.totalAmount)}</strong>
              <span>
                {order.paymentMethod === "RAZORPAY"
                  ? "Razorpay Test"
                  : "Cash on Delivery"}{" "}
                · {order.paymentStatus}
              </span>
            </div>
            <Button href={base + "/" + order._id} variant="secondary">
              View Order
            </Button>
            {role === "FARMER" && <FarmerOrderActions order={order} />}
          </article>
        ))}
      </div>
      {result.pages > 1 && (
        <nav className="commerce-pagination" aria-label="Order pages">
          {result.page > 1 && (
            <Button
              href={base + "?page=" + (result.page - 1)}
              variant="secondary"
            >
              Previous
            </Button>
          )}
          <span>
            Page {result.page} of {result.pages}
          </span>
          {result.page < result.pages && (
            <Button
              href={base + "?page=" + (result.page + 1)}
              variant="secondary"
            >
              Next
            </Button>
          )}
        </nav>
      )}
    </>
  );
}
export function OrderDetail({ order, role }) {
  const address = order.shippingAddress;
  return (
    <>
      <div className="commerce-row">
        <h1>Order #{order._id.slice(-8).toUpperCase()}</h1>
        <OrderBadge status={order.orderStatus} />
      </div>
      <div className="commerce-layout">
        <div>
          <section className="commerce-panel">
            <h2>
              {role === "BUYER"
                ? "Farmer: " + (order.farmer?.name || "Unavailable")
                : "Buyer: " + (order.buyer?.name || "Unavailable")}
            </h2>
            <OrderItems items={order.items} />
            <div className="commerce-row commerce-total">
              <span>Total</span>
              <strong>{formatCurrency(order.totalAmount)}</strong>
            </div>
            <p>
              {order.paymentMethod === "RAZORPAY"
                ? "Razorpay Test Payment"
                : "Cash on Delivery"}{" "}
              · {order.paymentStatus}
            </p>
            {order.paymentMethod === "RAZORPAY" && (
              <p className="commerce-note">
                Demo transaction. If rejected, stock is restored and the test
                payment record is retained. Production refunds are outside this
                phase.
              </p>
            )}
            {role === "FARMER" && <FarmerOrderActions order={order} />}
          </section>
          <section className="commerce-panel">
            <OrderTimeline history={order.statusHistory} />
          </section>
        </div>
        <aside className="commerce-panel">
          <h2>Delivery address</h2>
          <address className="commerce-address-display">
            {address.fullName}
            <br />
            {address.phone}
            <br />
            {address.addressLine1}
            <br />
            {address.addressLine2 && (
              <>
                {address.addressLine2}
                <br />
              </>
            )}
            {address.villageOrCity}, {address.district}
            <br />
            {address.state} — {address.postalCode}
          </address>
          <div className="commerce-actions">
            <Button
              href={role === "BUYER" ? "/buyer/orders" : "/farmer/orders"}
              variant="secondary"
            >
              All Orders
            </Button>
          </div>
        </aside>
      </div>
    </>
  );
}
