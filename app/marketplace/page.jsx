import Button from "@/components/ui/Button";
import { Sprout } from "lucide-react";
export default function Marketplace() {
  return (
    <section className="container coming-soon">
      <Sprout size={64} strokeWidth={1} />
      <span className="eyebrow">COMING SOON</span>
      <h1>
        Fresh connections
        <br />
        are on their way.
      </h1>
      <p>
        We’re preparing a direct marketplace for farmers and buyers.
        <br />
        Create your account now and be ready to grow with us.
      </p>
      <Button href="/register">Join FarmDirect →</Button>
    </section>
  );
}
