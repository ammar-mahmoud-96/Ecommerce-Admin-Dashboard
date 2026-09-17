import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "The email or password is incorrect.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/too-many-requests": "Too many attempts. Try again later.",
};

export default function LoginPage(): JSX.Element {
  const { user, isAdmin, isLoading, configError, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user && isAdmin) navigate("/", { replace: true });
  }, [isLoading, user, isAdmin, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice("");
    setIsSubmitting(true);
    try {
      await signIn(email, password);
      navigate("/", { replace: true });
    } catch (error) {
      const code =
        error && typeof error === "object" && "code" in error
          ? String(error.code)
          : "";
      setNotice(ERROR_MESSAGES[code] || "Unable to sign in right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="centered-screen">
      <div className="card login-card">
        <div className="brand login-brand">
          SHOP.CO<span>admin</span>
        </div>
        <h1>Sign in to the dashboard</h1>
        <p className="muted">Administrator accounts only.</p>

        {configError ? (
          <p className="alert alert-error">{configError}</p>
        ) : (
          <form className="form" onSubmit={handleSubmit}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <label htmlFor="password">Password</label>
            <input
              id="password"
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              required
            />
            <button
              className="button button-primary"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        )}

        {notice && (
          <p className="alert alert-error" role="alert">
            {notice}
          </p>
        )}
      </div>
    </div>
  );
}
