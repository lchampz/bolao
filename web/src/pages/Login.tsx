import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useParticipant } from "../context/ParticipantContext";

function VerifyLink({ token }: { token: string }) {
  const navigate = useNavigate();
  const { login } = useParticipant();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .verifyLoginToken(token)
      .then((participant) => {
        login(participant);
        navigate("/");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Link inválido ou expirado."));
  }, [token]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <div className="glass-card rounded-2xl p-8 w-[380px] text-center">
        <span className="text-5xl">🏆</span>
        {error ? (
          <>
            <p className="text-error mt-4">{error}</p>
            <a href="#/entrar" className="text-primary underline text-sm">
              Pedir um novo link
            </a>
          </>
        ) : (
          <p className="text-on-surface-variant mt-4">Entrando...</p>
        )}
      </div>
    </div>
  );
}

type Step = "email" | "password" | "sent" | "unknown";

/** Tela única — descobre pelo e-mail se é admin (pede senha), participante já
 * cadastrado (manda link por e-mail) ou desconhecido (orienta a pedir convite). */
function UnifiedLogin() {
  const navigate = useNavigate();
  const adminAuth = useAdminAuth();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { type } = await api.loginStart(email.trim());
      setStep(type === "admin" ? "password" : type === "participant" ? "sent" : "unknown");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível continuar.");
    } finally {
      setLoading(false);
    }
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    await adminAuth.login(email.trim(), password);
  }

  useEffect(() => {
    if (step === "password" && adminAuth.isAuthenticated) navigate("/admin");
  }, [step, adminAuth.isAuthenticated]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <div className="glass-card rounded-2xl p-8 w-[380px] flex flex-col gap-4">
        <span className="text-5xl text-center">🏆</span>
        <h2 className="font-headline-lg text-headline-lg text-center text-on-surface m-0">Entrar</h2>

        {step === "email" && (
          <form className="flex flex-col gap-4" onSubmit={submitEmail}>
            <p className="font-body-md text-body-md text-on-surface-variant text-center m-0">
              Informe seu e-mail para entrar no bolão ou na administração.
            </p>
            <input
              className="score-input rounded-lg px-4 py-3 font-body-md text-body-md"
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              required
            />
            {error && <span className="text-error text-sm">{error}</span>}
            <button
              className="bg-primary text-on-primary font-headline-md text-body-md py-3 rounded-lg glow-button font-bold"
              type="submit"
              disabled={loading}
            >
              {loading ? "Verificando..." : "Continuar"}
            </button>
          </form>
        )}

        {step === "password" && (
          <form className="flex flex-col gap-4" onSubmit={submitPassword}>
            <p className="font-body-md text-body-md text-on-surface-variant text-center m-0">
              <span className="text-primary font-bold">{email}</span> — informe a senha de administrador.
            </p>
            <input
              className="score-input rounded-lg px-4 py-3 font-body-md text-body-md"
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
            />
            {adminAuth.error && <span className="text-error text-sm">{adminAuth.error}</span>}
            <button
              className="bg-primary text-on-primary font-headline-md text-body-md py-3 rounded-lg glow-button font-bold"
              type="submit"
              disabled={adminAuth.loading}
            >
              {adminAuth.loading ? "Entrando..." : "Entrar"}
            </button>
            <button type="button" className="text-xs text-on-surface-variant underline" onClick={() => setStep("email")}>
              Usar outro e-mail
            </button>
          </form>
        )}

        {step === "sent" && (
          <>
            <p className="text-center text-primary text-sm">
              Enviamos um link de acesso para <strong>{email}</strong> — confira sua caixa de entrada (o link vale
              por 15 minutos).
            </p>
            <button type="button" className="text-xs text-on-surface-variant underline" onClick={() => setStep("email")}>
              Usar outro e-mail
            </button>
          </>
        )}

        {step === "unknown" && (
          <>
            <p className="text-center text-on-surface-variant text-sm">
              Não encontramos cadastro para <strong>{email}</strong>. Peça um convite ao organizador do bolão.
            </p>
            <button type="button" className="text-xs text-on-surface-variant underline" onClick={() => setStep("email")}>
              Tentar outro e-mail
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function Login() {
  const { token } = useParams<{ token: string }>();
  return token ? <VerifyLink token={token} /> : <UnifiedLogin />;
}
