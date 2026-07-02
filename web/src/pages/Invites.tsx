import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { RequireAdmin } from "../components/RequireAdmin";
import type { Invite } from "../types";

export default function Invites() {
  return (
    <RequireAdmin>
      <InvitesContent />
    </RequireAdmin>
  );
}

function InvitesContent() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function reload() {
    setInvites(await api.getInvites());
  }

  useEffect(() => {
    reload();
  }, []);

  async function sendOne(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setMsg(null);
    try {
      await api.createInvite(email.trim());
      setEmail("");
      setMsg(`Convite enviado para ${email.trim()}.`);
      await reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Falha ao enviar convite.");
    } finally {
      setSending(false);
    }
  }

  async function importCsv(file: File) {
    setImporting(true);
    setMsg(null);
    try {
      const text = await file.text();
      const result = await api.bulkInvite(text);
      setMsg(
        `${result.total} e-mails encontrados no arquivo — ${result.created} convites enviados, ${result.alreadyAccepted} já cadastrados.`,
      );
      await reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Falha ao importar CSV.");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function resend(id: string) {
    await api.resendInvite(id);
    setMsg("Convite reenviado.");
  }

  return (
    <div className="flex flex-col gap-gutter max-w-4xl">
      <h2 className="font-headline-lg text-headline-lg text-on-surface flex items-center gap-2 m-0">
        <span className="material-symbols-outlined text-secondary-fixed text-3xl">mail</span>
        Convites
      </h2>

      <section className="glass-panel rounded-2xl p-6">
        <h3 className="font-headline-md text-headline-md text-white m-0 mb-4">Convidar um e-mail</h3>
        <form className="flex flex-wrap gap-3" onSubmit={sendOne}>
          <input
            className="score-input rounded-lg px-4 h-12 flex-1 min-w-[240px] font-body-md text-body-md"
            type="email"
            placeholder="nome@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            className="bg-primary text-on-primary font-bold py-2 px-5 rounded-lg glow-button text-sm disabled:opacity-50"
            type="submit"
            disabled={sending}
          >
            {sending ? "Enviando..." : "Enviar convite"}
          </button>
        </form>
      </section>

      <section className="glass-panel rounded-2xl p-6">
        <h3 className="font-headline-md text-headline-md text-white m-0 mb-1">Importar lista (CSV)</h3>
        <p className="font-body-md text-body-md text-on-surface-variant mb-4">
          Um e-mail por linha (ou coluna) — com ou sem cabeçalho. Convites são enviados para todos os e-mails válidos
          encontrados.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv,text/plain"
          disabled={importing}
          onChange={(e) => e.target.files?.[0] && importCsv(e.target.files[0])}
          className="font-label-md text-label-md text-on-surface-variant"
        />
        {importing && <p className="text-sm text-primary mt-2">Importando e enviando convites...</p>}
      </section>

      {msg && (
        <div className="bg-primary-container/20 text-primary border border-primary/50 px-4 py-3 rounded-lg text-sm">
          {msg}
        </div>
      )}

      <section className="glass-panel rounded-2xl p-6">
        <h3 className="font-headline-md text-headline-md text-white m-0 mb-4">Convites enviados ({invites.length})</h3>
        <div className="space-y-2">
          {invites.map((invite) => (
            <div
              key={invite.id}
              className="bg-surface-container/50 border border-white/10 rounded-lg p-3 flex items-center justify-between gap-4"
            >
              <div>
                <div className="font-bold text-white text-sm">{invite.email}</div>
                <div className="text-xs text-on-surface-variant">
                  Convidado em {new Date(invite.createdAt).toLocaleString("pt-BR")}
                </div>
              </div>
              {invite.status === "ACCEPTED" ? (
                <span className="bg-primary-container/20 text-primary border border-primary/50 px-3 py-1 rounded-full flex items-center gap-1 text-xs font-bold">
                  <span className="material-symbols-outlined icon-filled text-[16px]">check_circle</span>
                  Cadastrado
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="bg-surface-variant/50 text-on-surface-variant border border-white/10 px-3 py-1 rounded-full text-xs">
                    Pendente
                  </span>
                  <button
                    className="border border-white/15 text-on-surface-variant hover:text-primary hover:border-primary/50 px-3 py-1 rounded-full text-xs transition-colors"
                    onClick={() => resend(invite.id)}
                  >
                    Reenviar
                  </button>
                </div>
              )}
            </div>
          ))}
          {invites.length === 0 && <p className="text-on-surface-variant text-sm">Nenhum convite enviado ainda.</p>}
        </div>
      </section>
    </div>
  );
}
