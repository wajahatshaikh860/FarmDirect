"use client";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function Logout() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="logout"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await signOut({ redirect: false });
          toast.success("Logout successful");
          router.push("/");
          router.refresh();
        } catch {
          toast.error("Something went wrong");
          setBusy(false);
        }
      }}
    >
      {busy ? "Signing out…" : "Logout"}
    </button>
  );
}
