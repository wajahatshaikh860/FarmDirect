import Logo from "@/components/ui/Logo";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import { Sprout, ShieldCheck } from "lucide-react";
export default function AuthPage({ register = false, initialRole = "BUYER" }) {
  return (
    <div className="container auth-container">
      <div className="auth-card">
        <div className="auth-content">
          <Logo />
          <h1>{register ? "Create Your Account" : "Welcome Back"}</h1>
          <p className="muted">
            {register
              ? "Join a community growing a better tomorrow."
              : "Good food. Great connections. Welcome home."}
          </p>
          {register ? (
            <RegisterForm initialRole={initialRole} />
          ) : (
            <LoginForm />
          )}
          <div className="secure-note">
            <ShieldCheck size={15} /> Your information is safe and secure.
          </div>
        </div>
        <aside className="auth-art">
          <span className="eyebrow">ROOTED IN POSSIBILITY</span>
          <Sprout className="auth-sprout" strokeWidth={1} />
          <div>
            <h2>
              {register ? "Grow Together" : "Good Food.\nBrighter Lives."}
            </h2>
            <p>
              A stronger farming community,
              <br />
              for a better tomorrow.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
