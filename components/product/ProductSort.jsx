import Button from "@/components/ui/Button";
export default function ProductSort({ filters }) {
  return (
    <form action="/marketplace" className="product-sort">
      <label htmlFor="product-sort">Sort by</label>
      <select
        id="product-sort"
        name="sort"
        defaultValue={filters.sort || "newest"}
      >
        <option value="newest">Newest</option>
        <option value="price-asc">Price Low → High</option>
        <option value="price-desc">Price High → Low</option>
      </select>
      {Object.entries(filters)
        .filter(
          ([key, value]) =>
            !["sort", "page"].includes(key) &&
            value !== undefined &&
            value !== "",
        )
        .map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
      <Button className="small" variant="secondary">
        Sort
      </Button>
    </form>
  );
}
