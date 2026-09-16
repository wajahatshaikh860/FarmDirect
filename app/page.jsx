import Hero from "@/components/home/Hero";
import TrustSection from "@/components/home/TrustSection";
import CTASection from "@/components/home/CTASection";

// Navbar, main, and Footer are provided once by app/layout.jsx.
export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustSection />
      <CTASection />
    </>
  );
}
