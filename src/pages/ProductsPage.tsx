import { useMemo, useState } from "react";
import { useOrders } from "../hooks/useOrders";
import { downloadCsv, formatPrice } from "../lib/format";

type ProductSales = {
  id: string;
  title: string;
  image?: string;
  unitsSold: number;
  revenue: number;
  orderCount: number;
  lastPrice: number;
};

export default function ProductsPage(): JSX.Element {
  const { orders, isLoading, error } = useOrders();
  const [search, setSearch] = useState("");

  const products = useMemo<ProductSales[]>(() => {
    const byProduct = new Map<string, ProductSales>();
    orders.forEach((order) => {
      order.items?.forEach((item) => {
        const key = String(item.id ?? item.title);
        const entry = byProduct.get(key) ?? {
          id: key,
          title: item.title,
          image: item.image,
          unitsSold: 0,
          revenue: 0,
          orderCount: 0,
          lastPrice: item.price,
        };
        entry.unitsSold += item.quantity;
        entry.revenue += item.price * item.quantity;
        entry.orderCount += 1;
        entry.image = entry.image ?? item.image;
        byProduct.set(key, entry);
      });
    });
    return [...byProduct.values()].sort(
      (first, second) => second.revenue - first.revenue,
    );
  }, [orders]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term
      ? products.filter((product) => product.title.toLowerCase().includes(term))
      : products;
  }, [products, search]);

  return (
    <section>
      <header className="page-header" style={{ marginBottom: 10 }}>
        <div>
          <h1>Products sold</h1>
          <p className="muted">
            Aggregated from the line items of every stored order.
          </p>
        </div>
        <button
          className="button"
          type="button"
          disabled={filtered.length === 0}
          onClick={() =>
            downloadCsv(
              `products-${new Date().toISOString().slice(0, 10)}.csv`,
              filtered.map((product) => ({
                id: product.id,
                title: product.title,
                unitsSold: product.unitsSold,
                revenue: product.revenue,
                orders: product.orderCount,
              })),
            )
          }
        >
          Export CSV
        </button>
      </header>

      {error && (
        <p className="alert alert-error">Could not read orders: {error}</p>
      )}

      <div className="toolbar mt-10">
        <input
          className="input"
          type="search"
          placeholder="Search products…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="table-wrap mt-10">
        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th className="align-right">Units sold</th>
              <th className="align-right">Orders</th>
              <th className="align-right">Revenue</th>
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
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="table-empty">
                  No products sold yet.
                </td>
              </tr>
            )}
            {filtered.map((product) => (
              <tr key={product.id}>
                <td>
                  <div className="product-cell">
                    {product.image && <img src={product.image} alt="" />}
                    <div>
                      <strong>{product.title}</strong>
                      <small className="cell-sub">
                        {formatPrice(product.lastPrice)} each
                      </small>
                    </div>
                  </div>
                </td>
                <td className="align-right">{product.unitsSold}</td>
                <td className="align-right">{product.orderCount}</td>
                <td className="align-right">
                  <strong>{formatPrice(product.revenue)}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
