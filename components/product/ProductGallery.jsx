"use client";
import { useState } from "react";
import Image from "next/image";
import ProductImage from "./ProductImage";
export default function ProductGallery({ images = [], name }) {
  const [selected, setSelected] = useState(0);
  return (
    <div className="product-gallery">
      <ProductImage
        key={images[selected]?.url || "empty"}
        src={images[selected]?.url}
        alt={name}
        priority
      />
      {images.length > 1 && (
        <div className="product-gallery-thumbnails">
          {images.map((image, index) => (
            <button
              type="button"
              key={image.publicId}
              aria-label={"Show image " + (index + 1)}
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
            >
              <Image
                src={image.url}
                alt={name + " image " + (index + 1)}
                width={80}
                height={70}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
