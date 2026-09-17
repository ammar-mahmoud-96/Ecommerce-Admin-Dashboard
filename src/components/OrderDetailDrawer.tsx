import { formatDate, formatPhone, formatPrice, titleCase } from "../lib/format";
import type { Order } from "../types";

export default function OrderDetailDrawer({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}): JSX.Element {
  const itemCount =
    order.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <div
      className="drawer-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Order details"
      onClick={onClose}
    >
      <aside className="drawer" onClick={(event) => event.stopPropagation()}>
        <header className="drawer-header">
          <div>
            <span className="muted">Order</span>
            <h2>#{order.id.slice(0, 8)}</h2>
            <small className="muted">
              {formatDate(order.createdAt as { seconds?: number })}
            </small>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="drawer-section">
          <h3>Customer</h3>
          <dl className="detail-list">
            <dt>Name</dt>
            <dd>{order.delivery?.fullName || "—"}</dd>
            <dt>Account email</dt>
            <dd>{order.userEmail || "—"}</dd>
            <dt>Contact email</dt>
            <dd>{order.contact?.email || "—"}</dd>
            <dt>Phone</dt>
            <dd>
              {formatPhone(
                order.contact?.phoneCountryCode,
                order.contact?.phone,
              )}
            </dd>
            <dt>Alt. phone</dt>
            <dd>
              {formatPhone(
                order.contact?.alternativePhoneCountryCode,
                order.contact?.alternativePhone,
              )}
            </dd>
            <dt>User ID</dt>
            <dd>
              <code>{order.userId}</code>
            </dd>
          </dl>
        </div>

        <div className="drawer-section">
          <h3>Delivery</h3>
          <dl className="detail-list">
            <dt>Governorate</dt>
            <dd>
              {order.delivery?.governorate
                ? titleCase(order.delivery.governorate)
                : "—"}
            </dd>
            <dt>Address</dt>
            <dd>{order.delivery?.address || "—"}</dd>
          </dl>
        </div>

        <div className="drawer-section">
          <h3>Items ({itemCount})</h3>
          <ul className="item-list">
            {order.items?.map((item, index) => (
              <li key={`${order.id}-${item.id}-${index}`}>
                {item.image && <img src={item.image} alt="" />}
                <div>
                  <strong>{item.title}</strong>
                  <small>
                    {[item.size, item.color].filter(Boolean).join(" / ") ||
                      "Standard"}{" "}
                    · Qty {item.quantity}
                  </small>
                </div>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="drawer-section">
          <h3>Payment</h3>
          <dl className="detail-list">
            <dt>Method</dt>
            <dd>
              {order.paymentMethod === "cash"
                ? "Cash on delivery"
                : titleCase(order.paymentMethod || "unknown")}
            </dd>
            <dt>Discount code</dt>
            <dd>{order.discountCode || "—"}</dd>
            <dt>Savings</dt>
            <dd>{formatPrice(order.totalSavings ?? 0)}</dd>
            <dt>Total</dt>
            <dd>
              <strong>{formatPrice(order.subtotal)}</strong>
            </dd>
          </dl>
        </div>
      </aside>
    </div>
  );
}
