import DashboardSidebar from "@/components/layout/DashboardSidebar";
import Notice from "./Notice";
import WelcomeSection from "./WelcomeSection";
import DashboardStats from "./DashboardStats";
import DashboardEmptyState from "./DashboardEmptyState";
import ProfileTip from "./ProfileTip";
export default function Dashboard({ user, counts }) {
  return (
    <div className="container dashboard">
      <Notice />
      <DashboardSidebar role={user.role} />
      <section className="dashboard-main">
        <WelcomeSection user={user} />
        <DashboardStats role={user.role} counts={counts} />
        <DashboardEmptyState role={user.role} />
        <ProfileTip />
      </section>
    </div>
  );
}
