"use client";
import { Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
export default function WishlistButton({ productId, initialSaved = false, compact = false }) {
  const { data: session } = useSession(); const [saved, setSaved] = useState(initialSaved); const [loading, setLoading] = useState(false);
  const router = useRouter();
  async function toggle() {
    if (!session?.user) { toast.error("Please log in to save products."); router.push("/login?callbackUrl=" + encodeURIComponent(window.location.pathname)); return; }
    if (session.user.role !== "BUYER") return toast.error("Wishlist is available to buyers only.");
    setLoading(true);
    try { const response = await fetch("/api/wishlist/" + productId, { method: saved ? "DELETE" : "POST" }); const data = await response.json(); if (!response.ok) throw new Error(data.message || "Could not update wishlist."); setSaved(data.saved); toast.success(data.saved ? "Saved to Wishlist" : "Removed from Wishlist"); }
    catch (error) { toast.error(error.message || "Could not update wishlist."); } finally { setLoading(false); }
  }
  return <button type="button" className={"wishlist-button" + (saved ? " saved" : "") + (compact ? " compact" : "")} onClick={toggle} disabled={loading} aria-pressed={saved} aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}><Heart size={compact ? 19 : 18} fill={saved ? "currentColor" : "none"} />{compact ? null : <span>{saved ? "Saved to Wishlist" : "Add to Wishlist"}</span>}</button>;
}

