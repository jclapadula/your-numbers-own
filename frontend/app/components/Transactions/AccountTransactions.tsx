import { useParams } from "react-router";
import { useTransactions } from "./TransactionsQueries";

export default function AccountTransactions() {
  const { accountId = "" } = useParams();

  const { data: transactions, isLoading } = useTransactions(accountId);

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-full">
        <span className="loading loading-spinner text-primary w-10"></span>
      </div>
    );

  return (
    <div>
      AccountTransactionsList
      <div>{JSON.stringify(transactions)}</div>
    </div>
  );
}
