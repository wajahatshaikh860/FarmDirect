"use client";
import { Menu, X } from "lucide-react";
export default function MobileMenu({ open, onToggle }) {
  return (
    <button
      className="menu-toggle"
      aria-label="Toggle navigation"
      aria-expanded={open}
      onClick={onToggle}
    >
      {open ? <X /> : <Menu />}
    </button>
  );
}
