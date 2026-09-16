import { ArrowUpRight } from "lucide-react";
import Button from "@/components/ui/Button";
export default function CTASection() {
  return (
    <section className="container join-section">
      <div>
        <span className="eyebrow">LET’S GROW SOMETHING GOOD</span>
        <h2>
          Your next chapter
          <br />
          starts here.
        </h2>
        <p>Whether you grow it or enjoy it, there’s a place for you.</p>
      </div>
      <Button href="/register">
        Join FarmDirect <ArrowUpRight size={18} />
      </Button>
    </section>
  );
}
