import { Sprout } from "lucide-react";
export default function DashboardEmptyState({ role }) {
  return (
    <div className="empty-state">
      <div className="value-icon">
        <Sprout size={30} />
      </div>
      <h2>Something good is growing.</h2>
      <p>
        {role === "FARMER"
          ? "Product listings, orders, and earnings will be available in a later phase."
          : role === "BUYER"
            ? "The marketplace, orders, and wishlist are coming in a later phase."
            : "User and farmer management tools are coming in a later phase."}
      </p>
      <span className="status-pill">Your account is ready</span>
    </div>
  );
}
