import type { Route } from "./+types/login";
import { LoginForm } from "~/components/Auth/LoginForm";
import { MfaLoginForm } from "~/components/Auth/MfaLoginForm";
import { useAuth } from "~/components/Auth/AuthContext";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Login - Your Numbers" },
    { name: "description", content: "Sign in to Your Numbers" },
  ];
}

export default function LoginPage() {
  const { requiresMfa } = useAuth();

  return requiresMfa ? <MfaLoginForm /> : <LoginForm />;
}