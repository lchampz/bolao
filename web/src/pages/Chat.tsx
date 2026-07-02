import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api";
import { Avatar } from "../components/Avatar";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useParticipant } from "../context/ParticipantContext";
import { AREA_LABELS, type Message, type Participant } from "../types";

const MESSAGES_POLL_MS = 3_000;
const ROSTER_POLL_MS = 15_000;
const ONLINE_THRESHOLD_MS = 90_000;
const MESSAGE_MAX_LENGTH = 500;

function isOnline(participant: Participant): boolean {
  if (!participant.lastSeenAt) return false;
  return Date.now() - new Date(participant.lastSeenAt).getTime() < ONLINE_THRESHOLD_MS;
}

function dateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function Chat() {
  const { participant } = useParticipant();
  const { isAuthenticated: isAdmin } = useAdminAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function pollMessages() {
      try {
        const data = await api.getChatMessages();
        if (!cancelled) setMessages(data);
      } catch {
        // silencioso — só uma leitura periódica, próxima tentativa já resolve
      }
    }
    pollMessages();
    const interval = setInterval(pollMessages, MESSAGES_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function pollRoster() {
      try {
        const data = await api.getParticipants();
        if (!cancelled) setParticipants(data);
      } catch {
        // idem — próxima tentativa resolve
      }
    }
    pollRoster();
    const interval = setInterval(pollRoster, ROSTER_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length]);

  const { online, offline } = useMemo(() => {
    const on: Participant[] = [];
    const off: Participant[] = [];
    for (const p of participants) (isOnline(p) ? on : off).push(p);
    return { online: on, offline: off };
  }, [participants]);

  const groups = useMemo(() => {
    const byDate = new Map<string, Message[]>();
    for (const m of messages) {
      const key = dateLabel(m.createdAt);
      if (!byDate.has(key)) byDate.set(key, []);
      byDate.get(key)!.push(m);
    }
    return Array.from(byDate.entries());
  }, [messages]);

  async function send() {
    if (!participant) return;
    const content = draft.trim();
    if (!content || content.length > MESSAGE_MAX_LENGTH) return;
    setSending(true);
    setError(null);
    try {
      const created = await api.sendChatMessage(participant.id, content);
      setMessages((m) => [...m, created]);
      setDraft("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível enviar");
    } finally {
      setSending(false);
    }
  }

  async function remove(id: string) {
    try {
      await api.deleteChatMessage(id);
      setMessages((m) => m.filter((msg) => msg.id !== id));
    } catch {
      // ignora — a próxima leitura periódica corrige a lista
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-8rem)] lg:h-[calc(100vh-7rem)]">
      <section className="glass-card rounded-xl flex flex-col flex-1 min-h-[400px] overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center gap-3 bg-surface-container/50">
          <span className="material-symbols-outlined text-primary text-3xl">forum</span>
          <div>
            <h2 className="font-headline-md text-headline-md font-bold text-white m-0">Chat Geral</h2>
            <p className="text-xs text-on-surface-variant m-0">Converse com todos os participantes do bolão</p>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
          {groups.length === 0 && (
            <p className="text-center text-on-surface-variant text-sm mt-12">
              Nenhuma mensagem ainda — seja o primeiro a falar!
            </p>
          )}
          {groups.map(([date, msgs]) => (
            <div key={date}>
              <div className="text-center text-xs text-on-surface-variant/60 uppercase tracking-wider mb-4">{date}</div>
              <div className="space-y-4">
                {msgs.map((m) => (
                  <div key={m.id} className="flex items-start gap-3 group">
                    <Avatar name={m.participantName} className="w-9 h-9 text-xs shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-white text-sm">{m.participantName}</span>
                        <span className="text-[10px] text-on-surface-variant/60">
                          {AREA_LABELS[m.participantArea]} · {timeLabel(m.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-on-surface-variant break-words m-0">{m.content}</p>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => remove(m.id)}
                        className="opacity-0 group-hover:opacity-100 text-on-surface-variant/50 hover:text-error transition-opacity"
                        title="Remover mensagem"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-white/10 bg-surface-container/30">
          {participant ? (
            <div className="flex items-center gap-3">
              <input
                className="flex-1 bg-surface-container rounded-lg px-4 py-3 text-sm text-white placeholder:text-on-surface-variant/50 border border-white/10 focus:border-primary/50 focus:outline-none"
                maxLength={MESSAGE_MAX_LENGTH}
                placeholder="Mande uma mensagem para o bolão..."
                value={draft}
                disabled={sending}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
              />
              <button
                className="bg-primary text-on-primary rounded-lg p-3 disabled:opacity-40 glow-button"
                disabled={sending || !draft.trim()}
                onClick={send}
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
          ) : (
            <div className="bg-secondary-fixed/10 border border-secondary-fixed/40 text-secondary-fixed px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">mail</span>
              Você precisa aceitar um convite para participar do chat. Verifique seu e-mail ou peça um convite ao
              organizador do bolão.
            </div>
          )}
          {error && <p className="text-error text-xs mt-2">{error}</p>}
        </div>
      </section>

      <aside className="lg:w-72 glass-card rounded-xl p-6 overflow-y-auto flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">groups</span>
          <h3 className="font-headline-md text-body-lg font-bold text-white m-0">Participantes</h3>
        </div>

        <div>
          <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Disponível — {online.length}</p>
          <div className="space-y-3">
            {online.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <Avatar name={p.name} className="w-9 h-9 text-xs" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary border-2 border-surface-container" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium m-0 truncate">{p.name}</p>
                  <p className="text-[10px] text-on-surface-variant m-0">{AREA_LABELS[p.area]}</p>
                </div>
              </div>
            ))}
            {online.length === 0 && <p className="text-xs text-on-surface-variant/60">Ninguém por aqui agora.</p>}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">Offline — {offline.length}</p>
          <div className="space-y-3">
            {offline.map((p) => (
              <div key={p.id} className="flex items-center gap-3 opacity-50">
                <div className="relative shrink-0">
                  <Avatar name={p.name} className="w-9 h-9 text-xs" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-on-surface-variant/50 border-2 border-surface-container" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium m-0 truncate">{p.name}</p>
                  <p className="text-[10px] text-on-surface-variant m-0">{AREA_LABELS[p.area]}</p>
                </div>
              </div>
            ))}
            {offline.length === 0 && <p className="text-xs text-on-surface-variant/60">Todo mundo online!</p>}
          </div>
        </div>
      </aside>
    </div>
  );
}
