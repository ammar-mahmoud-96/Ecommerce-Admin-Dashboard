import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useOrders } from "../hooks/useOrders";
import { useCustomers } from "../hooks/useCustomers";
import { formatDate, formatPrice, toDate } from "../lib/format";

function lastNDays(count: number): string[] {
  const days: string[] = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    days.push(date.toISOString().slice(0, 10));
  }
  return days;
}

export default function DashboardPage(): JSX.Element {
  const { orders, isLoading, error } = useOrders();
  const { customers } = useCustomers(orders, isLoading);

  const revenue = orders.reduce((sum, order) => sum + (order.subtotal ?? 0), 0);
  const unitsSold = orders.reduce(
    (sum, order) =>
      sum +
      (order.items?.reduce((itemSum, item) => itemSum + item.quantity, 0) ?? 0),
    0,
  );
  const averageOrderValue = orders.length > 0 ? revenue / orders.length : 0;
  const pendingCount = orders.filter(
    (order) => (order.status ?? "pending") === "pending",
  ).length;

  const salesSeries = useMemo(() => {
    const totals = new Map(lastNDays(14).map((day) => [day, 0]));
    orders.forEach((order) => {
      const date = toDate(order.createdAt as { seconds?: number });
      if (!date) return;
      const key = date.toISOString().slice(0, 10);
      if (totals.has(key))
        totals.set(key, (totals.get(key) ?? 0) + (order.subtotal ?? 0));
    });
    return [...totals.entries()].map(([day, total]) => ({
      day: day.slice(5),
      total: Number(total.toFixed(2)),
    }));
  }, [orders]);

  const recentOrders = orders.slice(0, 6);

  return (
    <section>
      <header className="page-header">
        <div>
          <h1>Overview</h1>
          <p className="muted">Live figures from Cloud Firestore.</p>
        </div>
      </header>

      {error && (
        <p className="alert alert-error">Could not read orders: {error}</p>
      )}

      <div className="stat-grid mt-10">
        <article className="card stat-card">
          <span>Total revenue</span>
          <strong>{formatPrice(revenue)}</strong>
          <small>Across {orders.length} orders</small>
        </article>
        <article className="card stat-card">
          <span>Orders</span>
          <strong>{orders.length}</strong>
          <small>{pendingCount} pending</small>
        </article>
        <article className="card stat-card">
          <span>Customers</span>
          <strong>{customers.length}</strong>
          <small>Signed-in shoppers</small>
        </article>
        <article className="card stat-card">
          <span>Average order</span>
          <strong>{formatPrice(averageOrderValue)}</strong>
          <small>{unitsSold} units sold</small>
        </article>
      </div>

      <article className="card mt-10">
        <h2>Revenue, last 14 days</h2>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={salesSeries}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#111" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#111" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                fontSize={12}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={12}
                width={70}
              />
              <Tooltip formatter={(value: number) => formatPrice(value)} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#111"
                fill="url(#revenueFill)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="card mt-10">
        <div className="card-heading">
          <h2>Recent orders</h2>
          <Link className="link-button" to="/orders">
            View all
          </Link>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Placed</th>
                <th>Customer</th>
                <th className="align-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={4} className="table-empty">
                    Loading…
                  </td>
                </tr>
              )}
              {!isLoading && recentOrders.length === 0 && (
                <tr>
                  <td colSpan={4} className="table-empty">
                    No orders yet.
                  </td>
                </tr>
              )}
              {recentOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <code>#{order.id.slice(0, 8)}</code>
                  </td>
                  <td>{formatDate(order.createdAt as { seconds?: number })}</td>
                  <td>{order.delivery?.fullName || order.userEmail || "—"}</td>
                  <td className="align-right">
                    <strong>{formatPrice(order.subtotal)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
