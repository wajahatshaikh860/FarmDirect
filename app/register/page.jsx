import AuthPage from "@/components/auth/AuthPage";
export const metadata = { title: "Create an account" };
export default async function Register({ searchParams }) {
  const params = await searchParams;
  return (
    <AuthPage
      register
      initialRole={params.role === "FARMER" ? "FARMER" : "BUYER"}
    />
  );
}
