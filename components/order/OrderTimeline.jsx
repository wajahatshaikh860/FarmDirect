export default function OrderTimeline({ history }) {
  return (
    <section>
      <h2>Order timeline</h2>
      <ol className="commerce-timeline">
        {history.map((event, index) => (
          <li key={event.status + index}>
            <strong>
              {event.status === "PENDING"
                ? "Placed"
                : event.status.charAt(0) + event.status.slice(1).toLowerCase()}
            </strong>
            <time dateTime={event.changedAt}>
              {new Date(event.changedAt).toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
              })}
            </time>
          </li>
        ))}
      </ol>
    </section>
  );
}
