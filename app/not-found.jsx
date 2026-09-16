import Button from "@/components/ui/Button";
export default function NotFound() {
  return (
    <section className="container coming-soon">
      <span className="eyebrow">404</span>
      <h1>This path hasn’t grown yet.</h1>
      <Button href="/">Back to home</Button>
    </section>
  );
}
