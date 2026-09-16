"use client";
import { Sprout, ShoppingBag } from "lucide-react";
import { SIGNUP_ROLES } from "@/lib/constants";
export default function RoleSelector({ role, onChange }) {
  return (
    <div className="role-picker" aria-label="Account role">
      {SIGNUP_ROLES.map((r) => (
        <button
          type="button"
          aria-pressed={role === r}
          className={role === r ? "selected" : ""}
          key={r}
          onClick={() => onChange(r)}
        >
          {r === "FARMER" ? <Sprout size={18} /> : <ShoppingBag size={18} />}{" "}
          {r === "FARMER" ? "Farmer" : "Buyer"}
        </button>
      ))}
    </div>
  );
}
