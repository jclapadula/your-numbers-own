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
              accountId === account.id && "text-primary font-semibold",
            )}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                {account.isLinked && (
                  <div
                    className="tooltip tooltip-right -ml-3"
                    data-tip="Linked account"
                  >
                    <div className="w-2 h-2 rounded-full bg-success" />
                  </div>
                )}
                <span>{account.name}</span>
              </div>
              <Amount amount={account.balance} className="text-nowrap" />
            </div>
          </Link>
        </li>
      ))}
    </>
  );
};
