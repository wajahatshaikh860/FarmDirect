import DashboardSidebar from "@/components/layout/DashboardSidebar";
import "./commerce.css";
import "../product/products.css";
export default function CommerceShell({
  children,
  role = "BUYER",
  activeLabel = "My Orders",
}) {
  return (
    <div className="container dashboard commerce-workspace">
      <DashboardSidebar role={role} activeLabel={activeLabel} />
      <section className="dashboard-main">{children}</section>
    </div>
  );
}
