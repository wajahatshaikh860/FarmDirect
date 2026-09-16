import { Sprout } from "lucide-react";
export default function WelcomeSection({ user }) {
  const role = user.role;
  return (
    <>
      <span className="eyebrow">A FRESH START</span>
      <h1>
        Welcome, {user.name} <Sprout size={27} />
      </h1>
      <p className="muted">
        {role === "FARMER"
          ? "Your farm’s next chapter starts here."
          : role === "BUYER"
            ? "Discover a closer connection to the food you love."
            : "Manage your growing FarmDirect community."}
      </p>
    </>
  );
}
