import { Outlet } from "react-router";
import Amount from "./Amount";
import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import { useAccounts } from "./AccountsQueries";

const AccountList = () => {
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

export default function Layout() {
  const accounts = [
    {
      name: "BBVA",
      balance: 104701,
    },
  ];

  const { isLoading, isAuthenticated, loginWithRedirect, logout } = useAuth0();
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      loginWithRedirect({
        authorizationParams: { redirect_uri: window.location.origin },
      });
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading || !isAuthenticated) {
    return <div>Loading...</div>;
  }

  return (
    <div className="drawer md:drawer-open">
      <input type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col items-center justify-center">
        <Outlet />
      </div>
      <div className="drawer-side bg-base-200 !overflow-visible">
        <div className="menu flex flex-col h-full justify-between">
          <ul className="w-64 p-4">
            <li>
              <a href="/budget">Budget</a>
            </li>
            <li className="menu-disabled">
              <a>
                Reports{" "}
                <span className="badge badge-info badge-sm">Coming soon</span>
              </a>
            </li>
            <div className="divider my-2" />
            <div className="flex justify-between items-baseline">
              <h2 className="menu-title">Accounts</h2>
              <div className="tooltip" data-tip="Add account">
                <button className="btn btn-xs btn-primary">+</button>
              </div>
            </div>
            <AccountList />
          </ul>
          <ul>
            <li>
              <button
                className="btn btn-sm btn-secondary btn-soft"
                onClick={() =>
                  logout({ logoutParams: { returnTo: window.location.origin } })
                }
              >
                Log out
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
