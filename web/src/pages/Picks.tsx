import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { CircularProgress } from "../components/CircularProgress";
import { useParticipant } from "../context/ParticipantContext";
import { PHASE_LABELS, type Game, type Pick, type Team } from "../types";

export default function Picks() {
  const { participant } = useParticipant();
  const [games, setGames] = useState<Game[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [drafts, setDrafts] = useState<Record<string, { home: string; away: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  async function reload() {
    const [g, t] = await Promise.all([api.getGames(), api.getTeams()]);
    setGames(g);
    setTeams(t);
    if (participant) setPicks(await api.getPicks(participant.id));
  }

  useEffect(() => {
    reload();
  }, [participant?.id]);

  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const pickByGameId = useMemo(() => new Map(picks.map((p) => [p.gameId, p])), [picks]);

  async function submit(game: Game) {
    if (!participant) return;
    const draft = drafts[game.id];
    const existing = pickByGameId.get(game.id);
    const home = draft ? Number(draft.home) : existing?.homeScore;
    const away = draft ? Number(draft.away) : existing?.awayScore;
    if (home == null || away == null || Number.isNaN(home) || Number.isNaN(away)) return;

    setSavingId(game.id);
    setErrorId(null);
    try {
      await api.submitPick(participant.id, game.id, home, away);
      await reload();
    } catch {
      setErrorId(game.id);
    } finally {
      setSavingId(null);
    }
  }

  const submittedCount = games.filter((g) => pickByGameId.has(g.id)).length;

  return (
    <div>
      {/* Header */}
      <section className="mb-8 md:mb-12">
        <div className="glass-panel rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="stadium-halo opacity-50" />
          <div className="z-10 text-center md:text-left">
            <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-1 m-0">Meus Palpites</h2>
            <p className="font-body-lg text-body-lg text-primary font-medium tracking-wide m-0">Oitavas de Final</p>
          </div>
          {participant && <CircularProgress value={submittedCount} total={games.length} />}
        </div>
      </section>

      {!participant && (
        <div className="mb-6 bg-secondary-fixed/10 border border-secondary-fixed/40 text-secondary-fixed px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">mail</span>
          Você precisa aceitar um convite para enviar palpites. Verifique seu e-mail ou peça um convite ao
          organizador do bolão.
        </div>
      )}

      {/* Match cards */}
      <section className="space-y-6 max-w-4xl mx-auto">
        {games.map((game) => {
          const home = teamById.get(game.homeTeamId);
          const away = teamById.get(game.awayTeamId);
          const existing = pickByGameId.get(game.id);
          const deadlinePassed = game.finished || Date.now() >= new Date(game.kickoff).getTime();
          const locked = deadlinePassed || !participant;
          const draft = drafts[game.id] ?? {
            home: existing ? String(existing.homeScore) : "",
            away: existing ? String(existing.awayScore) : "",
          };
          const dateLabel = new Date(game.kickoff).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <article
              key={game.id}
              className={`rounded-xl p-4 md:p-6 relative overflow-hidden group ${
                locked ? "glass-panel opacity-60 grayscale-[30%]" : "glass-card-floating"
              } ${existing && !locked ? "opacity-90" : ""}`}
            >
              {!locked && <div className="stadium-halo opacity-0 group-hover:opacity-30 transition-opacity duration-500" />}
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`px-3 py-1 flex items-center space-x-1 ${locked ? "text-on-surface-variant/50" : "text-on-surface-variant"}`}>
                  <span className="material-symbols-outlined text-[14px]">{locked ? "" : "schedule"}</span>
                  <span className="font-label-md text-label-md text-xs">
                    {PHASE_LABELS[game.phase]} · {dateLabel}
                  </span>
                </div>
                {deadlinePassed ? (
                  <div className="bg-surface-variant text-on-surface-variant border border-white/5 px-3 py-1 rounded-full flex items-center space-x-1">
                    <span className="material-symbols-outlined text-[16px]">lock</span>
                    <span className="font-label-md text-label-md text-xs">Prazo encerrado</span>
                  </div>
                ) : existing ? (
                  <div className="bg-primary-container/20 text-primary border border-primary/50 px-3 py-1 rounded-full flex items-center space-x-1 shadow-[0_0_10px_rgba(101,223,118,0.2)]">
                    <span className="material-symbols-outlined icon-filled text-[16px]">check_circle</span>
                    <span className="font-label-md text-label-md text-xs font-bold">Enviado</span>
                  </div>
                ) : (
                  <div className="bg-surface-variant/50 text-on-surface-variant border border-white/10 px-3 py-1 rounded-full flex items-center space-x-1">
                    <span className="font-label-md text-label-md text-xs">Pendente</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                <div className="flex flex-col items-center w-full md:w-1/3">
                  <div
                    className={`w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-surface-container shadow-[0_0_20px_rgba(0,0,0,0.5)] mb-3 flex items-center justify-center text-5xl bg-surface-variant ${
                      !locked ? "group-hover:scale-105 transition-transform duration-300" : "opacity-70"
                    }`}
                  >
                    {home?.flag}
                  </div>
                  <h3 className={`font-headline-md text-headline-md m-0 ${locked ? "text-on-surface-variant" : "text-white"}`}>{home?.name}</h3>
                </div>

                <div className="flex items-center justify-center space-x-4 w-full md:w-1/3">
                  <input
                    className="w-20 h-24 md:w-24 md:h-28 rounded-lg score-input font-stats-xl text-stats-xl focus:ring-0"
                    max={99}
                    min={0}
                    placeholder="-"
                    type="number"
                    disabled={locked}
                    value={draft.home}
                    onChange={(e) => setDrafts((d) => ({ ...d, [game.id]: { ...draft, home: e.target.value } }))}
                  />
                  <span className="font-stats-xl text-stats-xl text-on-surface-variant/50">X</span>
                  <input
                    className="w-20 h-24 md:w-24 md:h-28 rounded-lg score-input font-stats-xl text-stats-xl focus:ring-0"
                    max={99}
                    min={0}
                    placeholder="-"
                    type="number"
                    disabled={locked}
                    value={draft.away}
                    onChange={(e) => setDrafts((d) => ({ ...d, [game.id]: { ...draft, away: e.target.value } }))}
                  />
                </div>

                <div className="flex flex-col items-center w-full md:w-1/3">
                  <div
                    className={`w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-surface-container shadow-[0_0_20px_rgba(0,0,0,0.5)] mb-3 flex items-center justify-center text-5xl bg-surface-variant ${
                      !locked ? "group-hover:scale-105 transition-transform duration-300" : "opacity-70"
                    }`}
                  >
                    {away?.flag}
                  </div>
                  <h3 className={`font-headline-md text-headline-md m-0 ${locked ? "text-on-surface-variant" : "text-white"}`}>{away?.name}</h3>
                </div>
              </div>

              {!locked && (
                <div className="mt-6 pt-4 border-t border-white/10 flex justify-center relative z-10">
                  <button
                    className="bg-primary text-on-primary font-headline-md text-headline-md py-3 px-12 rounded-lg glow-button font-bold flex items-center justify-center w-full md:w-auto disabled:opacity-40"
                    disabled={savingId === game.id}
                    onClick={() => submit(game)}
                  >
                    {savingId === game.id ? "Salvando..." : existing ? "Atualizar Palpite" : "Salvar Palpite"}
                  </button>
                </div>
              )}
              {errorId === game.id && <p className="text-error text-sm text-center mt-2">Não foi possível salvar.</p>}
            </article>
          );
        })}
      </section>
    </div>
  );
}
