import DashboardSidebar from "@/components/layout/DashboardSidebar";
import "./products.css";
export default function ProductPageShell({
  children,
  workspace = false,
  activeLabel = "My Products",
}) {
  return workspace ? (
    <div className="container dashboard product-workspace">
      <DashboardSidebar role="FARMER" activeLabel={activeLabel} />
      <section className="dashboard-main">{children}</section>
    </div>
  ) : (
    <section className="container product-page">{children}</section>
  );
}
