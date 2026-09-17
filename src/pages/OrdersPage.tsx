import { useMemo, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { getFirebaseDb } from "../lib/firebase";
import { useOrders } from "../hooks/useOrders";
import {
  downloadCsv,
  formatDate,
  formatPhone,
  formatPrice,
  titleCase,
  toSeconds,
} from "../lib/format";
import { ORDER_STATUSES, type Order, type OrderStatus } from "../types";
import OrderDetailDrawer from "../components/OrderDetailDrawer";

const PAGE_SIZE = 12;

type SortKey = "createdAt" | "subtotal" | "items";

function matchesSearch(order: Order, term: string): boolean {
  if (!term) return true;
  const haystack = [
    order.id,
    order.userId,
    order.userEmail,
    order.contact?.email,
    order.contact?.phone,
    order.delivery?.fullName,
    order.delivery?.governorate,
    order.delivery?.address,
    ...(order.items?.map((item) => item.title) ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(term.toLowerCase());
}

export default function OrdersPage(): JSX.Element {
  const { orders, isLoading, error } = useOrders();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "cash" | "online">(
    "all",
  );
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortAscending, setSortAscending] = useState(false);
  const [page, setPage] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updateError, setUpdateError] = useState("");

  const filtered = useMemo(() => {
    const rows = orders.filter((order) => {
      if (
        statusFilter !== "all" &&
        (order.status ?? "pending") !== statusFilter
      )
        return false;
      if (paymentFilter !== "all" && order.paymentMethod !== paymentFilter)
        return false;
      return matchesSearch(order, search);
    });

    const direction = sortAscending ? 1 : -1;
    return rows.sort((first, second) => {
      if (sortKey === "subtotal")
        return (first.subtotal - second.subtotal) * direction;
      if (sortKey === "items") {
        const count = (order: Order) =>
          order.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
        return (count(first) - count(second)) * direction;
      }
      return (
        (toSeconds(first.createdAt as { seconds?: number }) -
          toSeconds(second.createdAt as { seconds?: number })) *
        direction
      );
    });
  }, [orders, search, statusFilter, paymentFilter, sortKey, sortAscending]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(
    currentPage * PAGE_SIZE,
    currentPage * PAGE_SIZE + PAGE_SIZE,
  );

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortAscending((ascending) => !ascending);
      return;
    }
    setSortKey(key);
    setSortAscending(false);
  };

  const changeStatus = async (order: Order, status: OrderStatus) => {
    setUpdateError("");
    try {
      await updateDoc(doc(getFirebaseDb(), "orders", order.id), { status });
      setSelectedOrder((current) =>
        current && current.id === order.id ? { ...current, status } : current,
      );
    } catch (updateFailure) {
      setUpdateError(
        updateFailure instanceof Error
          ? `Could not update the order status: ${updateFailure.message}`
          : "Could not update the order status.",
      );
    }
  };

  const exportCsv = () => {
    downloadCsv(
      `orders-${new Date().toISOString().slice(0, 10)}.csv`,
      filtered.map((order) => ({
        id: order.id,
        placedAt: formatDate(order.createdAt as { seconds?: number }),
        customer: order.delivery?.fullName ?? "",
        email: order.userEmail ?? order.contact?.email ?? "",
        phone: formatPhone(
          order.contact?.phoneCountryCode,
          order.contact?.phone,
        ),
        governorate: order.delivery?.governorate ?? "",
        address: order.delivery?.address ?? "",
        items:
          order.items
            ?.map((item) => `${item.title} x${item.quantity}`)
            .join(" | ") ?? "",
        paymentMethod: order.paymentMethod ?? "",
        discountCode: order.discountCode ?? "",
        subtotal: order.subtotal ?? 0,
        status: order.status ?? "pending",
      })),
    );
  };

  return (
    <section>
      <header className="page-header">
        <div>
          <h1>Orders</h1>
          <p className="muted">
            {filtered.length} of {orders.length} orders from the Firestore
            `orders` collection.
          </p>
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

      {error && (
        <p className="alert alert-error">Could not read orders: {error}</p>
      )}
      {updateError && <p className="alert alert-error">{updateError}</p>}

      <div className="toolbar mt-10">
        <input
          className="input"
          type="search"
          placeholder="Search by order id, customer, email, phone, product…"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(0);
          }}
        />
        <select
          className="input"
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value as "all" | OrderStatus);
            setPage(0);
          }}
        >
          <option value="all">All statuses</option>
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {titleCase(status)}
            </option>
          ))}
        </select>
        <select
          className="input"
          value={paymentFilter}
          onChange={(event) => {
            setPaymentFilter(event.target.value as "all" | "cash" | "online");
            setPage(0);
          }}
        >
          <option value="all">All payments</option>
          <option value="cash">Cash on delivery</option>
          <option value="online">Online payment</option>
        </select>
      </div>

      <div className="table-wrap mt-10">
        <table className="table">
          <thead>
            <tr>
              <th>Order</th>
              <th>
                <button
                  className="sort-button"
                  type="button"
                  onClick={() => toggleSort("createdAt")}
                >
                  Placed{" "}
                  {sortKey === "createdAt" ? (sortAscending ? "▲" : "▼") : ""}
                </button>
              </th>
              <th>Customer</th>
              <th>Delivery</th>
              <th>
                <button
                  className="sort-button"
                  type="button"
                  onClick={() => toggleSort("items")}
                >
                  Items {sortKey === "items" ? (sortAscending ? "▲" : "▼") : ""}
                </button>
              </th>
              <th>Payment</th>
              <th className="align-right">
                <button
                  className="sort-button"
                  type="button"
                  onClick={() => toggleSort("subtotal")}
                >
                  Total{" "}
                  {sortKey === "subtotal" ? (sortAscending ? "▲" : "▼") : ""}
                </button>
              </th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={8} className="table-empty">
                  Loading orders…
                </td>
              </tr>
            )}
            {!isLoading && visible.length === 0 && (
              <tr>
                <td colSpan={8} className="table-empty">
                  No orders match the current filters.
                </td>
              </tr>
            )}
            {visible.map((order) => (
              <tr
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="clickable-row"
              >
                <td>
                  <code>#{order.id.slice(0, 8)}</code>
                </td>
                <td>{formatDate(order.createdAt as { seconds?: number })}</td>
                <td>
                  <strong>{order.delivery?.fullName || "—"}</strong>
                  <small className="cell-sub">
                    {order.userEmail || order.contact?.email || "—"}
                  </small>
                </td>
                <td>
                  <span>
                    {order.delivery?.governorate
                      ? titleCase(order.delivery.governorate)
                      : "—"}
                  </span>
                  <small className="cell-sub">
                    {formatPhone(
                      order.contact?.phoneCountryCode,
                      order.contact?.phone,
                    )}
                  </small>
                </td>
                <td>
                  {order.items?.reduce((sum, item) => sum + item.quantity, 0) ??
                    0}
                </td>
                <td>
                  {order.paymentMethod === "cash"
                    ? "Cash on delivery"
                    : titleCase(order.paymentMethod || "unknown")}
                </td>
                <td className="align-right">
                  <strong>{formatPrice(order.subtotal)}</strong>
                </td>
                <td onClick={(event) => event.stopPropagation()}>
                  <select
                    className={`status-select status-${order.status ?? "pending"}`}
                    value={order.status ?? "pending"}
                    onChange={(event) =>
                      void changeStatus(
                        order,
                        event.target.value as OrderStatus,
                      )
                    }
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {titleCase(status)}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination mt-10">
        <button
          className="button"
          type="button"
          disabled={currentPage === 0}
          onClick={() => setPage(currentPage - 1)}
        >
          Previous
        </button>
        <span>
          Page {currentPage + 1} of {pageCount}
        </span>
        <button
          className="button"
          type="button"
          disabled={currentPage >= pageCount - 1}
          onClick={() => setPage(currentPage + 1)}
        >
          Next
        </button>
      </div>

      {selectedOrder && (
        <OrderDetailDrawer
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </section>
  );
}
