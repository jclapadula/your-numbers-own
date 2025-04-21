import { useAccounts } from "../Accounts/AccountsQueries";
import Amount from "../Amount";
import { Link } from "react-router";

export const AccountsList = () => {
  const { data: accounts, isLoading } = useAccounts();

  if (isLoading || !accounts) return null;

  return (
    <>
      {accounts.map((account) => (
        <li key={account.id}>
          <Link to={`/accounts/${account.id}/transactions`} className="block">
            <div className="flex justify-between items-baseline">
              <span>{account.name}</span>
              <Amount amount={1000.0} />
            </div>
          </Link>
        </li>
      ))}
    </>
  );
};
