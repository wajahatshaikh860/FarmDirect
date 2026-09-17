import { dashboardAnalytics } from "@/services/analyticsService";
import AnalyticsStats from "@/components/phase4/AnalyticsStats";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import Notice from "./Notice";
import WelcomeSection from "./WelcomeSection";
import ProfileTip from "./ProfileTip";
export default async function Dashboard({ user }) {
  const analytics = await dashboardAnalytics(user);
  return (
    <div className="container dashboard">
      <Notice />
      <DashboardSidebar role={user.role} />
      <section className="dashboard-main">
        <WelcomeSection user={user} />
        <AnalyticsStats role={user.role} data={analytics} />
        <ProfileTip />
      </section>
    </div>
  );
}
