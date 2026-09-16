"use client";
import Button from "@/components/ui/Button";

export default function ErrorPage({ reset }) {
  return (
    <section className="container coming-soon">
      <h1>We couldn’t load this page.</h1>
      <p>
        Please try again. If the issue continues, check your database
        configuration.
      </p>
      <Button onClick={reset}>Try again</Button>
    </section>
  );
}
