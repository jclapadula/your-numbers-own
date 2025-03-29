import { Outlet } from "react-router";

export default function Layout() {
  return (
    <div className="drawer md:drawer-open">
      <input type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col items-center justify-center">
        <Outlet />
      </div>
      <div className="drawer-side">
        <ul className="menu bg-base-200 text-base-content min-h-full w-64 p-4">
          <li>
            <a>Sidebar Item 1</a>
          </li>
        </ul>
      </div>
    </div>
  );
}
