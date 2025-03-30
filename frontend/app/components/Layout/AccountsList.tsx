import { useAccounts } from "../AccountsQueries";
import Amount from "../Amount";

export const AccountsList = () => {
  const { data: accounts, isLoading } = useAccounts();

  if (isLoading || !accounts) return null;

  return (
    <>
      {accounts.map((account) => (
        <li key={account.name}>
          <div className="flex justify-between items-baseline">
            <a>{account.name}</a>
            <Amount amount={account.balance} />
          </div>
        </li>
      ))}
    </>
  );
};
