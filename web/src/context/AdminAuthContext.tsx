import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "../api";

interface AdminAuthContextValue {
  isAuthenticated: boolean;
  adminEmail: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

const TOKEN_KEY = "bolao.adminToken";
const EMAIL_KEY = "bolao.adminEmail";

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (localStorage.getItem(TOKEN_KEY)) setAdminEmail(localStorage.getItem(EMAIL_KEY));
  }, []);

  async function login(email: string, password: string) {
    setLoading(true);
    setError(null);
    try {
      const { token } = await api.adminLogin(email, password);
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(EMAIL_KEY, email);
      setAdminEmail(email);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no login");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    setAdminEmail(null);
  }

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated: !!adminEmail, adminEmail, login, logout, loading, error }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth deve ser usado dentro de AdminAuthProvider");
  return ctx;
}
