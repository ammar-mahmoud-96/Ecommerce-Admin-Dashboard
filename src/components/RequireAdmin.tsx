import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireAdmin({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const { user, isAdmin, isLoading, signOutAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="centered-screen">
        <div className="spinner" aria-label="Loading" />
      </div>
    );
  }

  if (!user)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  if (!isAdmin) {
    return (
      <div className="centered-screen">
        <div className="card denied-card">
          <h1>Access denied</h1>
          <p>
            <strong>{user.email}</strong> is not an administrator. Ask an
            existing admin to create a document at
            <code> admins/{user.uid}</code> in Firestore.
          </p>
          <button
            className="button"
            type="button"
            onClick={() => void signOutAdmin()}
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
