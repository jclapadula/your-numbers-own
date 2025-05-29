import AccountTransactions from "~/components/Transactions/AccountTransactions";
import type { Route } from "./+types/budget";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Your Numbers - Transactions" },
    { name: "description", content: "Welcome to Your Numbers" },
  ];
}

export default AccountTransactions;
