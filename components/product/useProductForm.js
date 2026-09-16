"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
export default function useProductForm(product, returnTo = "/farmer/products") {
  const router = useRouter(),
    [busy, setBusy] = useState(false),
    [errors, setErrors] = useState({}),
    [files, setFiles] = useState([]),
    [existing, setExisting] = useState(product?.images || []);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const { village, district, state, ...fields } = values;
    const body = new FormData();
    body.append(
      "data",
      JSON.stringify({ ...fields, location: { village, district, state } }),
    );
    body.append(
      "retainedImages",
      JSON.stringify(existing.map((image) => image.publicId)),
    );
    for (const item of files) body.append("images", item.file);
    try {
      const response = await fetch(
        product ? "/api/products/" + product._id : "/api/products",
        { method: product ? "PATCH" : "POST", body },
      );
      const result = await response.json();
      if (!response.ok) {
        setErrors(result.errors || {});
        toast.error(result.message || "Something went wrong");
        return;
      }
      toast.success(
        product ? "Product updated successfully" : "Product added successfully",
      );
      if (result.cleanupFailed)
        toast.warning("Some obsolete image cleanup could not be completed.");
      router.push(returnTo);
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return { busy, errors, files, setFiles, existing, setExisting, submit };
}
