"use client";
import Button from "@/components/ui/Button";
export default function ErrorPage({ reset }) {
  return (
    <section className="container" style={{ padding: "48px 0" }}>
      <h1>Unable to load this page</h1>
      <p>Please try again.</p>
      <Button onClick={reset}>Retry</Button>
    </section>
  );
}
