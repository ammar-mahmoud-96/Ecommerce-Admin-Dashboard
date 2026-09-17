import { useMemo, useState } from "react";
import { useOrders } from "../hooks/useOrders";
import { useCustomers } from "../hooks/useCustomers";
import { downloadCsv, formatDateShort, formatPrice } from "../lib/format";

export default function CustomersPage(): JSX.Element {
  const { orders, isLoading: ordersLoading, error: ordersError } = useOrders();
  const { customers, isLoading, usersError, hasUsersCollection } = useCustomers(
    orders,
    ordersLoading,
  );
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter((customer) =>
      [customer.displayName, customer.email, customer.phone, customer.uid]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [customers, search]);

  const exportCsv = () => {
    downloadCsv(
      `customers-${new Date().toISOString().slice(0, 10)}.csv`,
      filtered.map((customer) => ({
        uid: customer.uid,
        name: customer.displayName ?? "",
        email: customer.email ?? "",
        phone: customer.phone ?? "",
        signedUpAt: formatDateShort(customer.createdAt as { seconds?: number }),
        orders: customer.orderCount,
        totalSpent: customer.totalSpent,
        lastOrder: formatDateShort(customer.lastOrderAt),
        source: customer.derived ? "orders" : "users collection",
      })),
    );
  };

  return (
    <section>
      <header className="page-header" style={{ marginBottom: 10 }}>
        <div>
          <h1>Customers</h1>
          <p className="muted">{filtered.length} signed-in customers.</p>
        </div>
        <button
          className="button"
          type="button"
          onClick={exportCsv}
          disabled={filtered.length === 0}
        >
          Export CSV
        </button>
      </header>

      {ordersError && (
        <p className="alert alert-error mt-10">
          Could not read orders: {ordersError}
        </p>
      )}
      {!hasUsersCollection && (
        <p className="alert alert-info mt-10">
          No readable <code>users</code> collection was found
          {usersError ? ` (${usersError})` : ""}. The rows below are
          reconstructed from the <code>orders</code> collection, so customers
          who never checked out are missing. See the README for the snippet that
          makes the storefront write a <code>users/&#123;uid&#125;</code>{" "}
          document on sign up.
        </p>
      )}

      <div className="toolbar mt-10">
        <input
          className="input"
          type="search"
          placeholder="Search by name, email, phone or UID…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="table-wrap mt-10">
        <table className="table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Signed up</th>
              <th className="align-right">Orders</th>
              <th className="align-right">Total spent</th>
              <th>Last order</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={8} className="table-empty">
                  Loading customers…
                </td>
              </tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="table-empty">
                  No customers found.
                </td>
              </tr>
            )}
            {filtered.map((customer) => (
              <tr key={customer.uid}>
                <td>
                  <strong>{customer.displayName || "Unnamed shopper"}</strong>
                  <small className="cell-sub">
                    <code>{customer.uid.slice(0, 12)}…</code>
                  </small>
                </td>
                <td>{customer.email || "—"}</td>
                <td>{customer.phone || "—"}</td>
                <td>
                  {formatDateShort(customer.createdAt as { seconds?: number })}
                </td>
                <td className="align-right">{customer.orderCount}</td>
                <td className="align-right">
                  <strong>{formatPrice(customer.totalSpent)}</strong>
                </td>
                <td>{formatDateShort(customer.lastOrderAt)}</td>
                <td>
                  <span
                    className={`badge ${customer.derived ? "badge-muted" : "badge-ok"}`}
                  >
                    {customer.derived ? "orders" : "users"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
