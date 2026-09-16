import AuthForm from "./AuthForm";
export default function RegisterForm({ initialRole = "BUYER" }) {
  return <AuthForm register initialRole={initialRole} />;
}
