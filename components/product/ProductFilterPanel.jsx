"use client";
import { useState } from "react";
export default function ProductFilterPanel({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <aside className="product-filter-panel">
      <button
        className="product-filter-toggle"
        type="button"
        aria-expanded={open}
        aria-controls="product-filters"
        onClick={() => setOpen(!open)}
      >
        Filters <span>{open ? "−" : "+"}</span>
      </button>
      <div
        id="product-filters"
        className={"product-filter-content" + (open ? " open" : "")}
      >
        {children}
      </div>
    </aside>
  );
}
