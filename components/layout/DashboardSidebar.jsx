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
  BUYER: ["Dashboard", "Marketplace", "Cart", "My Orders", "Wishlist", "Profile"],
  ADMIN: ["Dashboard", "Users", "Farmers", "Products", "Orders", "Settings"],
};
const icons = {
  Dashboard: LayoutDashboard,
  "My Products": Package,
  "Add Product": Plus,
  Orders: ShoppingBag,
  Cart: ShoppingBag,
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

export default function DashboardSidebar({ role, activeLabel = "Dashboard" }) {
  return (
    <aside className="dashboard-sidebar">
      <span className="eyebrow">{role} WORKSPACE</span>
      <nav aria-label="Dashboard navigation">
        {menus[role].map((label) => {
          const Icon = icons[label];
          const href =
            label === "Dashboard"
              ? "/" + role.toLowerCase() + "/dashboard"
              : label === "Profile"
                ? "/profile"
                : role === "FARMER" && label === "My Products"
                  ? "/farmer/products"
                  : role === "FARMER" && label === "Add Product"
                    ? "/farmer/products/new"
                    : role === "BUYER" && label === "Marketplace"
                      ? "/marketplace"
                      : role === "BUYER" && label === "Cart"
                        ? "/cart"
                        : role === "BUYER" && label === "My Orders"
                          ? "/buyer/orders"
                          : role === "FARMER" && label === "Orders"
                            ? "/farmer/orders"
                            : null;
          return href ? (
            <Link
              href={href}
              className={label === activeLabel ? "active" : undefined}
              key={label}
            >
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
