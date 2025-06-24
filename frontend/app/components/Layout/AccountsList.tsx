import { twMerge } from "tailwind-merge";
import { useAccounts } from "../Accounts/AccountsQueries";
import Amount from "../Amount";
import { Link, useParams } from "react-router";

export const AccountsList = () => {
  const { data: accounts, isLoading } = useAccounts();
  const { accountId } = useParams();

  if (isLoading || !accounts) return null;

  return (
    <>
      {accounts.map((account) => (
        <li key={account.id}>
          <Link
            to={`/accounts/${account.id}/transactions`}
            className={twMerge(
              "block",
              accountId === account.id && "text-primary font-semibold"
            )}
          >
            <div className="flex justify-between items-baseline">
              <span>{account.name}</span>
              <Amount amount={account.balance} />
            </div>
          </Link>
        </li>
      ))}
    </>
  );
};
