import { Link, Outlet, useLocation } from "react-router";
import { useAuth } from "../Auth/AuthContext";
import { AccountsList } from "./AccountsList";
import { CreateAccountModal } from "../Accounts/CreateAccountModal";
import { MfaSetupModal } from "../Auth/MfaSetupModal";
import { DisableMfaModal } from "../Auth/DisableMfaModal";
import { useLogin } from "./useLogin";
import { useState } from "react";
import { useCurrentBudgetContext } from "../Contexts/CurrentBudgetContext";

export default function Layout() {
  const { isLoading, isAuthenticated } = useLogin();
  const { logout, user, showMfaSetupModal, dismissMfaSetup } = useAuth();
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [showMfaSetupFromSettings, setShowMfaSetupFromSettings] =
    useState(false);
  const [showDisableMfaModal, setShowDisableMfaModal] = useState(false);
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
    <div className="drawer md:drawer-open" style={{ isolation: "auto" }}>
      {showCreateAccountModal && (
        <CreateAccountModal onClose={() => setShowCreateAccountModal(false)} />
      )}
      <input type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col items-center justify-center">
        <Outlet />
      </div>
      <div
        className="drawer-side bg-base-200 !overflow-visible"
        style={{ isolation: "auto" }}
      >
        <div className="menu flex flex-col h-full justify-between">
          <ul className="w-64 p-2 pl-0">
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
              <div className="flex gap-2">
                <button
                  className="btn btn-sm btn-secondary btn-soft flex-1"
                  onClick={() => logout()}
                >
                  Log out
                </button>
                <div className="dropdown dropdown-top dropdown-end">
                  <button
                    tabIndex={0}
                    className="btn btn-sm btn-secondary btn-soft"
                  >
                    •••
                  </button>
                  <ul
                    tabIndex={0}
                    className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52"
                  >
                    {user?.mfaEnabled ? (
                      <li>
                        <button onClick={() => setShowDisableMfaModal(true)}>
                          Disable MFA
                        </button>
                      </li>
                    ) : (
                      <li>
                        <button
                          onClick={() => setShowMfaSetupFromSettings(true)}
                        >
                          Set up MFA
                        </button>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {(showMfaSetupModal || showMfaSetupFromSettings) && (
        <MfaSetupModal
          onClose={() => {
            dismissMfaSetup();
            setShowMfaSetupFromSettings(false);
          }}
          onSuccess={() => {
            if (user) {
              user.mfaEnabled = true;
            }
          }}
        />
      )}

      {showDisableMfaModal && (
        <DisableMfaModal onClose={() => setShowDisableMfaModal(false)} />
      )}
    </div>
  );
}
