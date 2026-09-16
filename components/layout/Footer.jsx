import Logo from "@/components/ui/Logo";
import Link from "next/link";
export default function Footer() {
  return (
    <footer id="contact">
      <div className="container footer-grid">
        <div>
          <Logo />
          <p>
            A closer connection to your food.
            <br />A brighter future for our farmers.
          </p>
        </div>
        <div>
          <strong>Explore FarmDirect</strong>
          <Link href="/marketplace">Marketplace</Link>
          <Link href="/register?role=FARMER">Become a farmer</Link>
          <Link href="/login">Your account</Link>
        </div>
        <div>
          <strong>Let’s grow together</strong>
          <p>
            Built to connect farmers and buyers,
            <br />
            one community at a time.
          </p>
          <span className="eyebrow">FRESH. FAIR. LOCAL.</span>
        </div>
      </div>
      <div className="container footer-bottom">
        © {new Date().getFullYear()} FarmDirect{" "}
        <span>From Farmers. To You.</span>
      </div>
    </footer>
  );
}
