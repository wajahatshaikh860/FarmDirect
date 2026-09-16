import {
  ArrowUpRight,
  Sprout,
  Leaf,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { heroContent } from "@/data/siteContent";
export default function Hero() {
  return (
    <section className="hero container">
      <div className="hero-copy">
        <span className="eyebrow">
          <span className="dot" /> FRESH FROM THE SOURCE
        </span>
        <h1>
          {heroContent.title[0]}
          <br />
          <span>{heroContent.title[1]}</span>
          <br />
          {heroContent.title[2]}
        </h1>
        <p>
          {heroContent.description[0]}
          <br />
          {heroContent.description[1]}
        </p>
        <div className="hero-actions">
          <Button href="/marketplace">
            {heroContent.primaryButton} <ArrowUpRight size={18} />
          </Button>
          <Button variant="secondary" href="/register?role=FARMER">
            {heroContent.secondaryButton} <ArrowRight size={18} />
          </Button>
        </div>
        <div className="hero-note">
          <ShieldCheck size={18} /> Fair for farmers. Good for you.
        </div>
      </div>
      <div className="hero-art">
        <div
          className="field-scene"
          role="img"
          aria-label="Sunlit agricultural fields with a growing plant"
        >
          <div className="sun" />
          <div className="hill hill-back" />
          <div className="hill hill-front" />
          <Sprout className="scene-sprout" strokeWidth={1} />
          <div className="art-label">
            <span className="dot" /> A BETTER WAY TO GROW
          </div>
          <div className="art-caption">
            <span>Rooted in care.</span>
            <strong>
              Made for a<br />
              better tomorrow.
            </strong>
          </div>
        </div>
        <div className="floating-note">
          <span className="logo-icon">
            <Leaf size={25} />
          </span>
          <div>
            <strong>From farm to you</strong>
            <small>Fresh connections. Real impact.</small>
          </div>
        </div>
      </div>
    </section>
  );
}
