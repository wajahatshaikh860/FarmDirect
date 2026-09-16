"use client";
import { useState } from "react";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import PasswordInput from "./PasswordInput";
import RoleSelector from "./RoleSelector";
import FarmFields from "./FarmFields";
import useAuthForm from "./useAuthForm";
export default function AuthForm({ register = false, initialRole = "BUYER" }) {
  const { role, setRole, errors, busy, submit } = useAuthForm({
    register,
    initialRole,
  });
  const [visible, setVisible] = useState(false);
  return (
    <form onSubmit={submit} className="auth-form">
      {register && (
        <>
          <RoleSelector role={role} onChange={setRole} />
          <Input
            name="name"
            label="Full name"
            required
            autoComplete="name"
            maxLength={100}
            error={errors.name}
          />
        </>
      )}
      <Input
        name="email"
        label="Email address"
        type="email"
        required
        autoComplete="email"
        maxLength={254}
        error={errors.email}
      />
      {register && (
        <Input
          name="phone"
          label="Phone number"
          type="tel"
          required
          autoComplete="tel"
          maxLength={100}
          error={errors.phone}
        />
      )}
      <PasswordInput
        visible={visible}
        onToggle={() => setVisible(!visible)}
        minLength={register ? 8 : undefined}
        autoComplete={register ? "new-password" : "current-password"}
        error={errors.password}
      />
      {register && (
        <>
          <PasswordInput
            name="confirmPassword"
            label="Confirm password"
            visible={visible}
            autoComplete="new-password"
            error={errors.confirmPassword}
          />
          {role === "FARMER" && <FarmFields errors={errors} />}
          <p className="form-note">
            Use at least 8 characters for your password.
          </p>
        </>
      )}
      <Button className="full" disabled={busy}>
        {busy && <LoaderCircle className="spin" size={18} />}{" "}
        {busy ? "Please wait…" : register ? "Create Account" : "Login"}{" "}
        {!busy && <span>→</span>}
      </Button>
      <p className="auth-switch">
        {register ? "Already have an account?" : "New to FarmDirect?"}{" "}
        <Link href={register ? "/login" : "/register"}>
          {register ? "Login" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
