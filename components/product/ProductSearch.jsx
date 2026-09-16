import Button from "@/components/ui/Button";
export default function ProductSearch({ filters }) {
  return (
    <form action="/marketplace" className="product-search">
      <label className="sr-only" htmlFor="product-search">
        Search products
      </label>
      <input
        id="product-search"
        name="q"
        type="search"
        placeholder="Search produce, category, or location…"
        defaultValue={filters.q || ""}
        maxLength={100}
      />
      {Object.entries(filters)
        .filter(
          ([key, value]) =>
            !["q", "page"].includes(key) && value !== undefined && value !== "",
        )
        .map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
      <Button className="small">Search</Button>
    </form>
  );
}
