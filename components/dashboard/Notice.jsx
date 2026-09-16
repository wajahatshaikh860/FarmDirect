"use client";
import { useEffect } from "react";
import { toast } from "sonner";
export default function Notice() {
  useEffect(() => {
    if (
      new URLSearchParams(window.location.search).get("error") ===
      "unauthorized"
    ) {
      toast.error("Unauthorized access");
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);
  return null;
}
