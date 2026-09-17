import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  getFirebaseAuth,
  getFirebaseDb,
  isFirebaseConfigured,
} from "../lib/firebase";

type AuthState = {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  configError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOutAdmin: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setConfigError(
        "Firebase is not configured. Copy .env.example to .env.local and fill in the VITE_FIREBASE_* values.",
      );
      setIsLoading(false);
      return;
    }

    return onAuthStateChanged(getFirebaseAuth(), async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }
      try {
        // Authorization source of truth is the `admins/{uid}` document, which the
        // Firestore rules also check — the client check alone is not a security boundary.
        const adminDoc = await getDoc(
          doc(getFirebaseDb(), "admins", currentUser.uid),
        );
        setIsAdmin(adminDoc.exists());
      } catch {
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    });
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      isAdmin,
      isLoading,
      configError,
      signIn: async (email, password) => {
        await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      },
      signOutAdmin: async () => {
        await signOut(getFirebaseAuth());
      },
    }),
    [user, isAdmin, isLoading, configError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside an AuthProvider.");
  return context;
}
