import type { Route } from "./+types/login";
import { LoginForm } from "~/components/Auth/LoginForm";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Login - Your Numbers" },
    { name: "description", content: "Sign in to Your Numbers" },
  ];
}

export default function LoginPage() {
  return <LoginForm />;
}