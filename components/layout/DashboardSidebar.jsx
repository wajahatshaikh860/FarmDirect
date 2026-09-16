import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Sprout,
  Wallet,
  Heart,
  UserRound,
  Settings,
  Plus,
} from "lucide-react";
import Logout from "@/components/auth/Logout";

const menus = {
  FARMER: [
    "Dashboard",
    "My Products",
    "Add Product",
    "Orders",
    "Earnings",
    "Profile",
  ],
  BUYER: ["Dashboard", "Marketplace", "My Orders", "Wishlist", "Profile"],
  ADMIN: ["Dashboard", "Users", "Farmers", "Products", "Orders", "Settings"],
};
const icons = {
  Dashboard: LayoutDashboard,
  "My Products": Package,
  "Add Product": Plus,
  Orders: ShoppingBag,
  Earnings: Wallet,
  Profile: UserRound,
  Marketplace: Sprout,
  "My Orders": ShoppingBag,
  Wishlist: Heart,
  Users: Users,
  Farmers: Sprout,
  Products: Package,
  Settings: Settings,
};

export default function DashboardSidebar({ role }) {
  return (
    <aside className="dashboard-sidebar">
      <span className="eyebrow">{role} WORKSPACE</span>
      <nav aria-label="Dashboard navigation">
        {menus[role].map((label, i) => {
          const Icon = icons[label];
          return i === 0 ? (
            <Link
              href={`/${role.toLowerCase()}/dashboard`}
              className="active"
              key={label}
            >
              <Icon size={17} />
              {label}
            </Link>
          ) : label === "Profile" ? (
            <Link key={label} href="/profile">
              <Icon size={17} />
              {label}
            </Link>
          ) : (
            <span
              className="disabled-nav"
              key={label}
              title="Coming in a later phase"
            >
              <Icon size={17} />
              {label}
              <small>Soon</small>
            </span>
          );
        })}
        <Logout />
      </nav>
    </aside>
  );
}
