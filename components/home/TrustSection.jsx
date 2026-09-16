import { Sprout, Leaf, HandCoins, HeartHandshake } from "lucide-react";
const values = [
  {
    icon: Sprout,
    title: "Direct from Farmers",
    text: "A shorter journey from their fields to your table.",
    tag: "NO MIDDLEMEN",
  },
  {
    icon: Leaf,
    title: "Fresh & Quality",
    text: "Good food starts with people who care about growing it.",
    tag: "GROWN WITH CARE",
  },
  {
    icon: HandCoins,
    title: "Fair Prices",
    text: "Better value for you. Fairer earnings for our farmers.",
    tag: "EVERYONE BENEFITS",
  },
  {
    icon: HeartHandshake,
    title: "Support Local",
    text: "Every connection helps our communities grow stronger.",
    tag: "ROOTED IN COMMUNITY",
  },
];

export default function TrustSection() {
  return (
    <section className="value-section" id="about">
      <div className="container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">SMALL CONNECTIONS. BIG CHANGE.</span>
            <h2>
              Good for you.
              <br />
              Better for everyone.
            </h2>
          </div>
          <p>
            We’re bringing farmers and buyers closer together.
            <br />
            Because a fairer food system starts with a direct connection.
          </p>
        </div>
        <div className="value-grid">
          {values.map(({ icon: Icon, title, text, tag }) => (
            <article className="value-card" key={title}>
              <span className="value-icon">
                <Icon size={25} />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
              <small>{tag}</small>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
