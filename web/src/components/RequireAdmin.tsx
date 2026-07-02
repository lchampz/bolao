import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAdminAuth } from "../context/AdminAuthContext";

function LoginPrompt() {
  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center">
      <div className="glass-card rounded-2xl p-8 w-[360px] flex flex-col gap-4 text-center">
        <span className="material-symbols-outlined text-4xl text-secondary-fixed">admin_panel_settings</span>
        <h2 className="font-headline-md text-headline-md text-on-surface m-0">Login de administrador necessário</h2>
        <Link
          to="/entrar"
          className="bg-primary text-on-primary font-headline-md text-body-md py-3 rounded-lg glow-button font-bold"
        >
          Ir para o login
        </Link>
      </div>
    </div>
  );
}

/** Gate para telas admin: valida a sessão com uma chamada leve (detecta token expirado/inválido). */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAuthenticated, logout } = useAdminAuth();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    api
      .getLastSync()
      .then(() => setVerified(true))
      .catch(() => logout());
  }, [isAuthenticated]);

  if (!isAuthenticated) return <LoginPrompt />;
  if (!verified) return <p className="text-on-surface-variant">Verificando sessão...</p>;
  return <>{children}</>;
}
