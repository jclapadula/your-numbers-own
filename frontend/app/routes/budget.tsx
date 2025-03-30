import type { Route } from "./+types/home";
import Budget from "../components/Budget";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Your Numbers - Budget" },
    { name: "description", content: "Welcome to Your Numbers" },
  ];
}

export default Budget;
