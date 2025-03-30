import { Outlet } from "react-router";
import Amount from "./Amount";

export default function Layout() {
  const accounts = [
    {
      name: "BBVA",
      balance: 104701,
    },
  ];

  return (
    <div className="drawer md:drawer-open">
      <input type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col items-center justify-center">
        <Outlet />
      </div>
      <div className="drawer-side bg-base-200 !overflow-visible">
        <div className="flex flex-col">
          <ul className="menu min-h-full w-64 p-4">
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
            {accounts.map((account) => (
              <li key={account.name}>
                <div className="flex justify-between items-baseline">
                  <a>{account.name}</a>
                  <Amount amount={account.balance} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
