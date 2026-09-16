export default function StatCard({ label, value, icon: Icon }) {
  return (
    <article className="stat-card">
      <Icon size={22} />
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}
