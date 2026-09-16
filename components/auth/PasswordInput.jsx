"use client";
import { Eye, EyeOff } from "lucide-react";
import Input from "@/components/ui/Input";
export default function PasswordInput({
  visible,
  onToggle,
  name = "password",
  label = "Password",
  ...props
}) {
  return (
    <Input
      name={name}
      label={label}
      type={visible ? "text" : "password"}
      required
      maxLength={72}
      {...props}
    >
      {onToggle && (
        <button
          type="button"
          className="eye"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={onToggle}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </Input>
  );
}
