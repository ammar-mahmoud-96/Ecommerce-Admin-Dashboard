import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/", label: "Overview", end: true },
  { to: "/orders", label: "Orders" },
  { to: "/customers", label: "Customers" },
  { to: "/products", label: "Products" },
];

export default function AdminLayout(): JSX.Element {
  const { user, signOutAdmin } = useAuth();
  const [isNavOpen, setIsNavOpen] = useState(false);

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${isNavOpen ? "open" : ""}`}>
        <div className="brand">
          SHOP.CO<span>admin</span>
        </div>
        <nav>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
              onClick={() => setIsNavOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="avatar">
            {(user?.email ?? "?").charAt(0).toUpperCase()}
          </span>
          <div>
            <strong>{user?.displayName || "Administrator"}</strong>
            <small>{user?.email}</small>
          </div>
          <button
            className="link-button"
            type="button"
            onClick={() => void signOutAdmin()}
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            className="menu-button"
            type="button"
            onClick={() => setIsNavOpen((open) => !open)}
            aria-label="Toggle navigation"
          >
            ☰
          </button>
          <span>Store administration</span>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
