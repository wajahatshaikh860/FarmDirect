"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { toast } from "sonner";
import { dashboardFor } from "@/lib/constants";
// Browser orchestration only. Credential verification and password hashing stay server-side.
export default function useAuthForm({
  register = false,
  initialRole = "BUYER",
} = {}) {
  const router = useRouter();
  const [role, setRole] = useState(initialRole);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (register) {
        const response = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...values, role }),
        });
        const data = await response.json();
        if (!response.ok) {
          setErrors(data.errors || {});
          toast.error(data.message);
          return;
        }
        toast.success("Account created successfully");
        router.push("/login?registered=1");
        router.refresh();
      } else {
        const result = await signIn("credentials", {
          email: values.email,
          password: values.password,
          redirect: false,
        });
        if (result?.error) {
          toast.error(
            result.error === "Account suspended"
              ? "Account suspended"
              : result.error === "CredentialsSignin"
                ? "Invalid credentials"
                : "Login is temporarily unavailable",
          );
          return;
        }
        const session = await getSession();
        if (!session?.user) {
          toast.error("Unable to load your session");
          return;
        }
        toast.success("Login successful");
        router.push(dashboardFor(session.user.role));
        router.refresh();
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return { role, setRole, errors, busy, submit };
}
