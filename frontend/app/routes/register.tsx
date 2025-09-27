import type { Route } from "./+types/register";
import { RegisterForm } from "~/components/Auth/RegisterForm";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Register - Your Numbers" },
    { name: "description", content: "Create your Your Numbers account" },
  ];
}

export default function RegisterPage() {
  return <RegisterForm />;
}