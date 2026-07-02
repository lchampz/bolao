import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useParticipant } from "../context/ParticipantContext";
import type { Area } from "../types";

type LoadState = "loading" | "valid" | "accepted" | "invalid";

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { login } = useParticipant();

  const [state, setState] = useState<LoadState>("loading");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [area, setArea] = useState<Area>("TI");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api
      .getInviteByToken(token)
      .then((invite) => {
        setEmail(invite.email);
        setState(invite.status === "ACCEPTED" ? "accepted" : "valid");
      })
      .catch(() => setState("invalid"));
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const participant = await api.acceptInvite(token, name.trim(), area);
      login(participant);
      navigate("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível aceitar o convite.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <div className="glass-card rounded-2xl p-8 w-[400px] flex flex-col gap-4">
        <span className="text-5xl text-center">🏆</span>
        <h2 className="font-headline-lg text-headline-lg text-center text-on-surface m-0">Copa AMM Points 2026</h2>

        {state === "loading" && <p className="text-center text-on-surface-variant">Verificando convite...</p>}

        {state === "invalid" && (
          <p className="text-center text-error">
            Este link de convite não é válido. Peça ao organizador do bolão para enviar um novo.
          </p>
        )}

        {state === "accepted" && (
          <p className="text-center text-on-surface-variant">
            Este convite já foi utilizado. Se o cadastro é seu, use o dispositivo/navegador onde você se cadastrou —
            não guardamos senha, só a sessão local.
          </p>
        )}

        {state === "valid" && (
          <form className="flex flex-col gap-4" onSubmit={submit}>
            <p className="font-body-md text-body-md text-on-surface-variant text-center m-0">
              Convite para <span className="text-primary font-bold">{email}</span> — complete seu cadastro:
            </p>
            <input
              className="score-input rounded-lg px-4 py-3 font-body-md text-body-md"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <select
              className="score-input rounded-lg px-4 py-3 font-body-md text-body-md"
              value={area}
              onChange={(e) => setArea(e.target.value as Area)}
            >
              <option value="TI">TI</option>
              <option value="RH">RH</option>
              <option value="FINANCEIRO">Financeiro</option>
              <option value="OUTRA">Outra área</option>
            </select>
            {error && <span className="text-error text-sm">{error}</span>}
            <button
              className="bg-primary text-on-primary font-headline-md text-body-md py-3 rounded-lg glow-button font-bold"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Entrando..." : "Entrar no bolão"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
