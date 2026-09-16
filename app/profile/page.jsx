import Button from "@/components/ui/Button";
import { requireAuth } from "@/lib/permissions";
import { dashboardFor } from "@/lib/constants";
export default async function Profile() {
  const user = await requireAuth();
  return (
    <section className="container profile-card">
      <span className="eyebrow">YOUR ACCOUNT</span>
      <h1>Your Profile</h1>
      <dl>
        <dt>Name</dt>
        <dd>{user.name}</dd>
        <dt>Email</dt>
        <dd>{user.email}</dd>
        <dt>Role</dt>
        <dd>{user.role}</dd>
      </dl>
      <Button href={dashboardFor(user.role)}>Back to dashboard</Button>
    </section>
  );
}
