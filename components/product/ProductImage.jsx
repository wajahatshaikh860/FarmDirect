"use client";
import { useState } from "react";
import Image from "next/image";
import { Sprout } from "lucide-react";
export default function ProductImage({ src, alt, priority = false }) {
  const [failed, setFailed] = useState(false);
  const valid =
    src?.startsWith("https://res.cloudinary.com/") &&
    src.includes("/image/upload/");
  return (
    <div className="product-image">
      {valid && !failed ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width:760px) 100vw, (max-width:1100px) 50vw, 400px"
          priority={priority}
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className="product-image-fallback"
          role="img"
          aria-label={alt + " — no image available"}
        >
          <Sprout size={48} strokeWidth={1.4} />
          <span>Fresh from the farm</span>
        </div>
      )}
    </div>
  );
}
