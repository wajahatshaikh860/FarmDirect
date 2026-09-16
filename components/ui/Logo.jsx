import Link from "next/link";
import { Sprout } from "lucide-react";
export default function Logo() {
  return (
    <Link href="/" className="logo" aria-label="FarmDirect home">
      <span className="logo-icon">
        <Sprout size={31} />
      </span>
      <span>
        FarmDirect<small>From Farmers. To You.</small>
      </span>
    </Link>
  );
}
