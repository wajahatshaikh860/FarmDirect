import DashboardSidebar from "@/components/layout/DashboardSidebar";
import "./products.css";
export default function ProductPageShell({
  children,
  workspace = false,
  activeLabel = "My Products",
  fullWidth = false,
  marketplace = false,
}) {
  return workspace ? (
    <div className="container dashboard product-workspace">
      <DashboardSidebar role="FARMER" activeLabel={activeLabel} />
      <section className="dashboard-main">{children}</section>
    </div>
  ) : (
    <section className={"container product-page" + (fullWidth ? " product-page-wide" : "") + (marketplace ? " marketplace-page" : "")}>{children}</section>
  );
}
