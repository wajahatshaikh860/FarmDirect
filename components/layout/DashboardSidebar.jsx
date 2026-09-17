"use client";
import { useEffect, useRef, useState } from "react";
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
  Menu,
  X,
} from "lucide-react";
import Logout from "@/components/auth/Logout";
import "./dashboard-layout.css";

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
  const [open, setOpen] = useState(false);
  const sidebar = useRef(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sidebar.current?.querySelector("button, a")?.focus();
    function keydown(event) {
      if (event.key === "Escape") setOpen(false);
      if (event.key !== "Tab") return;
      const nodes = [...sidebar.current.querySelectorAll("a, button")];
      const first = nodes[0], last = nodes.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    function resize() { if (window.innerWidth >= 1000) setOpen(false); }
    document.addEventListener("keydown", keydown);
    window.addEventListener("resize", resize);
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", keydown); window.removeEventListener("resize", resize); previous?.focus?.(); };
  }, [open]);
  return (
    <>
    <div className="workspace-mobile-nav"><span className="eyebrow">{role} WORKSPACE</span><button type="button" aria-expanded={open} aria-controls={"workspace-" + role} onClick={() => setOpen(true)}><Menu size={18} /> Workspace menu</button></div>
    {open && <button type="button" className="workspace-drawer-backdrop" aria-label="Close workspace menu" onClick={() => setOpen(false)} />}
    <aside ref={sidebar} id={"workspace-" + role} className={"dashboard-sidebar" + (open ? " workspace-open" : "")} role={open ? "dialog" : undefined} aria-modal={open ? true : undefined} aria-label={open ? "Workspace menu" : undefined}>
      <button type="button" className="workspace-close" onClick={() => setOpen(false)}><X size={18} /> Close menu</button>
      <span className="eyebrow">{role} WORKSPACE</span>
      <nav aria-label="Dashboard navigation" onClick={() => setOpen(false)}>
        {menus[role].map((label) => {
          const Icon = icons[label];
          const href =
            label === "Dashboard"
              ? "/" + role.toLowerCase() + "/dashboard"
              : label === "Farmers" && role === "ADMIN"
              ? "/admin/farmers"
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
                          : role === "BUYER" && label === "Wishlist"
                        ? "/buyer/wishlist"
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
    </>
  );
}
