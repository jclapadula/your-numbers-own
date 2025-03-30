import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Your Numbers" },
    { name: "description", content: "Welcome to Your Numbers" },
  ];
}

export default function Home() {
  return <>Home</>;
}
