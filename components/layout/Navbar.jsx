"use client";
import Link from "next/link";
import NotificationBell from "@/components/phase4/NotificationBell";
import { useSession } from "next-auth/react";
import { useState } from "react";
import MobileMenu from "./MobileMenu";
import Button from "@/components/ui/Button";
import { navbarLinks } from "@/data/siteContent";
import Logo from "@/components/ui/Logo";
import Logout from "@/components/auth/Logout";
import { dashboardFor } from "@/lib/constants";
export default function Navbar() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="container nav">
        <Logo />
        <MobileMenu open={open} onToggle={() => setOpen(!open)} />
        <nav
          className={open ? "nav-links open" : "nav-links"}
          aria-label="Main navigation"
          onClick={() => setOpen(false)}
        >
          {navbarLinks.map(({ href, label }) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
          {user ? (
            <>
              <Link href={dashboardFor(user.role)}>Dashboard</Link>
              <Link href="/profile">Profile</Link>
              {user.role === "FARMER" && (
                <Link href="/farmer/dashboard">Sell Produce</Link>
              )}
              <NotificationBell key={user.id} />
              <Logout />
            </>
          ) : (
            <>
              <Link href="/#about">About</Link>
              <Link href="/#contact">Contact</Link>
              {status === "loading" ? (
                <span className="muted">Loading…</span>
              ) : (
                <>
                  <Button variant="secondary" className="small" href="/login">
                    Login
                  </Button>
                  <Button className="small" href="/register">
                    Sign Up <span>↗</span>
                  </Button>
                </>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
