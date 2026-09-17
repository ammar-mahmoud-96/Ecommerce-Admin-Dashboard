import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "./components/AdminLayout";
import RequireAdmin from "./components/RequireAdmin";
import DashboardPage from "./pages/DashboardPage";
import OrdersPage from "./pages/OrdersPage";
import CustomersPage from "./pages/CustomersPage";
import ProductsPage from "./pages/ProductsPage";
import LoginPage from "./pages/LoginPage";

export default function App(): JSX.Element {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/products" element={<ProductsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
