import Link from "next/link";
export default function ProductPagination({ page, pages, base, filters = {} }) {
  if (pages <= 1) return null;
  function href(next) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters))
      if (value !== undefined && value !== "") params.set(key, String(value));
    params.set("page", String(next));
    return base + "?" + params;
  }
  return (
    <nav className="product-pagination" aria-label="Product pages">
      {page > 1 && (
        <Link className="button secondary small" href={href(page - 1)}>
          ← Previous
        </Link>
      )}
      <span>
        Page {page} of {pages}
      </span>
      {page < pages && (
        <Link className="button secondary small" href={href(page + 1)}>
          Next →
        </Link>
      )}
    </nav>
  );
}
