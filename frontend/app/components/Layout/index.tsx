import { Link, Outlet, useLocation } from "react-router";
import { useAuth0 } from "@auth0/auth0-react";
import { AccountsList } from "./AccountsList";
import { CreateAccountModal } from "../Accounts/CreateAccountModal";
import { useLogin } from "./useLogin";
import { useState } from "react";
import { useCurrentBudgetContext } from "../Contexts/CurrentBudgetContext";

export default function Layout() {
  const { isLoading, isAuthenticated } = useLogin();
  const { logout } = useAuth0();
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const { budgetId } = useCurrentBudgetContext();
  const { pathname } = useLocation();

  if (isLoading || !isAuthenticated || !budgetId) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="loading loading-spinner text-primary w-10"></span>
      </div>
    );
  }

  return (
    <div className="drawer md:drawer-open">
      {showCreateAccountModal && (
        <CreateAccountModal onClose={() => setShowCreateAccountModal(false)} />
      )}
      <input type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col items-center justify-center">
        <Outlet />
      </div>
      <div className="drawer-side bg-base-200 !overflow-visible">
        <div className="menu flex flex-col h-full justify-between">
          <ul className="w-64 p-4">
            <li>
              <Link
                to="/"
                className={pathname === "/" ? "text-primary font-semibold" : ""}
              >
                Budget
              </Link>
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
                <button
                  className="btn btn-xs btn-primary"
                  onClick={() => setShowCreateAccountModal(true)}
                >
                  +
                </button>
              </div>
            </div>
            <AccountsList />
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
