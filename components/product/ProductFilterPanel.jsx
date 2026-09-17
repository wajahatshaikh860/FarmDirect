"use client";
import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
export default function ProductFilterPanel({ children }) {
  const [open, setOpen] = useState(false);
  return <section className="product-filter-panel">
    <button className="product-filter-toggle" type="button" aria-expanded={open} aria-controls="product-filters" onClick={() => setOpen(!open)}><SlidersHorizontal size={17} /> Filters</button>
    <div id="product-filters" className={"product-filter-content" + (open ? " open" : "")}>
      <div className="product-filter-panel-heading"><h2>Filters</h2><button type="button" className="product-filter-close" onClick={() => setOpen(false)}><X size={16} /> Close</button></div>
      {children}
    </div>
  </section>;
}
