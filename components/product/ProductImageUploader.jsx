"use client";
import { useEffect, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  MAX_PRODUCT_IMAGES,
  MAX_PRODUCT_IMAGE_BYTES,
  PRODUCT_IMAGE_TYPES,
} from "@/lib/constants";
export default function ProductImageUploader({
  existing,
  onExistingChange,
  files,
  onFilesChange,
  disabled,
}) {
  const urls = useRef(new Set());
  useEffect(
    () => () => {
      for (const url of urls.current) URL.revokeObjectURL(url);
    },
    [],
  );
  function select(event) {
    const selected = Array.from(event.target.files);
    event.target.value = "";
    if (existing.length + files.length + selected.length > MAX_PRODUCT_IMAGES) {
      toast.error("Use up to five product images");
      return;
    }
    if (
      selected.some(
        (file) =>
          !PRODUCT_IMAGE_TYPES.includes(file.type) ||
          !file.size ||
          file.size > MAX_PRODUCT_IMAGE_BYTES,
      )
    ) {
      toast.error("Use JPEG, PNG, or WebP images up to 5 MB each");
      return;
    }
    const items = selected.map((file) => {
      const preview = URL.createObjectURL(file);
      urls.current.add(preview);
      return { file, preview, id: crypto.randomUUID() };
    });
    onFilesChange([...files, ...items]);
  }
  function remove(item) {
    URL.revokeObjectURL(item.preview);
    urls.current.delete(item.preview);
    onFilesChange(files.filter((file) => file.id !== item.id));
  }
  return (
    <fieldset className="product-upload">
      <legend>Product Images</legend>
      <p className="muted">Up to 5 images · JPEG, PNG, WebP · 5 MB each</p>
      <div className="product-image-previews">
        {existing.map((image) => (
          <div key={image.publicId}>
            <Image
              src={image.url}
              alt="Existing product image"
              width={120}
              height={100}
            />
            <button
              type="button"
              disabled={disabled}
              aria-label="Remove existing image"
              onClick={() =>
                onExistingChange(
                  existing.filter((item) => item.publicId !== image.publicId),
                )
              }
            >
              Remove
            </button>
          </div>
        ))}
        {files.map((item) => (
          <div key={item.id}>
            <Image
              src={item.preview}
              alt={item.file.name}
              width={120}
              height={100}
              unoptimized
            />
            <button
              type="button"
              disabled={disabled}
              aria-label={"Remove " + item.file.name}
              onClick={() => remove(item)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <label className="field">
        <span>Choose images</span>
        <input
          type="file"
          multiple
          accept={PRODUCT_IMAGE_TYPES.join(",")}
          disabled={
            disabled || existing.length + files.length >= MAX_PRODUCT_IMAGES
          }
          onChange={select}
        />
      </label>
    </fieldset>
  );
}
