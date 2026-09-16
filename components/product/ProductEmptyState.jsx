import { Sprout } from "lucide-react";
import Button from "@/components/ui/Button";
export default function ProductEmptyState({
  title = "No products found.",
  description = "Try changing your search or filters.",
  href,
  label,
}) {
  return (
    <div className="empty-state product-empty">
      <div className="value-icon">
        <Sprout size={30} />
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      {href && (
        <Button href={href} className="small">
          {label}
        </Button>
      )}
    </div>
  );
}
