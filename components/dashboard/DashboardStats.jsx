import {
  Package,
  ShoppingBag,
  Users,
  Sprout,
  Wallet,
  Heart,
  UserRound,
} from "lucide-react";
import StatCard from "./StatCard";
export default function DashboardStats({ role, counts }) {
  const stats =
    role === "ADMIN"
      ? [
          ["Users", counts.users, Users],
          ["Farmers", counts.farmers, Sprout],
          ["Buyers", counts.buyers, UserRound],
          ["Products", 0, Package],
          ["Orders", 0, ShoppingBag],
        ]
      : role === "FARMER"
        ? [
            ["Products", 0, Package],
            ["Orders", 0, ShoppingBag],
            ["Earnings", "₹0", Wallet],
          ]
        : [
            ["Orders", 0, ShoppingBag],
            ["Wishlist", 0, Heart],
          ];
  return (
    <div className="stats-grid">
      {stats.map(([label, value, Icon]) => (
        <StatCard key={label} label={label} value={value} icon={Icon} />
      ))}
    </div>
  );
}
