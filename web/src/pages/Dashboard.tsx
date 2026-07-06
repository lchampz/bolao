import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { Avatar } from "../components/Avatar";
import { HexBadge } from "../components/HexBadge";
import { PointsBreakdown } from "../components/PointsBreakdown";
import { Tooltip } from "../components/Tooltip";
import { useCountdown } from "../hooks/useCountdown";
import { useParticipant } from "../context/ParticipantContext";
import { AREA_LABELS, PHASE_LABELS, type Area, type Game, type Pick, type RankingEntry, type Team } from "../types";

const AREA_BAR_COLOR: Record<Area, string> = {
  TI: "from-on-tertiary-container to-primary shadow-[0_0_10px_theme('colors.primary')]",
  FINANCEIRO: "from-surface-variant to-surface-variant",
  RH: "from-surface-variant to-surface-variant",
  OUTRA: "from-surface-variant to-surface-variant",
};

export default function Dashboard() {
  const { participant } = useParticipant();
  const [games, setGames] = useState<Game[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [areaTotals, setAreaTotals] = useState<Record<string, number>>({});
  const [antecedenciaMinutos, setAntecedenciaMinutos] = useState(120);

  useEffect(() => {
    api.getGames().then(setGames);
    api.getTeams().then(setTeams);
    api.getRanking().then(setRanking);
    api.getAreaRanking().then(setAreaTotals);
    api.getConfig().then((c) => setAntecedenciaMinutos(c.antecedenciaMinutos));
    if (participant) api.getPicks(participant.id).then(setPicks);
  }, [participant?.id]);

  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const pickByGameId = useMemo(() => new Map(picks.map((p) => [p.gameId, p])), [picks]);
  const nextGame = games.find((g) => !g.finished);
  const countdown = useCountdown(nextGame?.kickoff ?? null);
  const upcoming = games.filter((g) => !g.finished).slice(0, 2);
  const top3 = ranking.slice(0, 3);
  const podiumOrder = [top3[1], top3[0], top3[2]];
  const myEntry = ranking.find((r) => r.participantId === participant?.id);

  const badges = [
    {
      icon: "alarm",
      label: "Madrugador",
      color: "#b5c4ff",
      active: (myEntry?.earlyBirdPoints ?? 0) > 0,
      tooltip: `Enviou um palpite com pelo menos ${antecedenciaMinutos} minutos de antecedência do início do jogo.`,
    },
    {
      icon: "sports_soccer",
      label: "Artilheiro",
      color: "#ffe243",
      active: (myEntry?.exactCount ?? 0) > 0,
      tooltip: "Acertou o placar exato de pelo menos um jogo (+3 AMM Points).",
    },
    {
      icon: "shield",
      label: "Invicto",
      color: "#65a5df",
      active: (myEntry?.streakPoints ?? 0) > 0,
      tooltip: "Conquistou uma sequência de 3 acertos consecutivos (placar exato ou vencedor).",
    },
  ];

  const areas = Object.keys(AREA_LABELS) as Area[];
  const maxArea = Math.max(1, ...Object.values(areaTotals));
  const leaderArea = areas.reduce<Area | null>((best, a) => {
    if (!areaTotals[a]) return best;
    if (!best || areaTotals[a] > (areaTotals[best] ?? 0)) return a;
    return best;
  }, null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
      {/* Hero */}
      <section className="col-span-1 md:col-span-12 glass-panel rounded-3xl p-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between border-t border-l border-white/20">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-tertiary/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="z-10 text-center md:text-left mb-8 md:mb-0">
          {nextGame && (
            <span className="inline-block px-4 py-1 rounded-full bg-secondary-fixed/20 text-secondary-fixed border border-secondary-fixed/50 font-label-md text-label-md mb-4 uppercase tracking-widest">
              {PHASE_LABELS[nextGame.phase]}
            </span>
          )}
          <h2 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-2 drop-shadow-lg">
            Copa AMM Points 2026
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-6 max-w-lg">
            Prepare seus palpites. A glória corporativa aguarda.
          </p>
          {nextGame && (
            <div className="flex items-center gap-4 bg-surface-container-high/80 rounded-xl p-4 w-fit mx-auto md:mx-0 border border-white/10">
              <span className="material-symbols-outlined text-tertiary text-3xl">timer</span>
              <div className="font-stats-xl text-stats-xl text-white font-mono tabular-nums tracking-widest">
                {String(countdown.days).padStart(2, "0")}:{String(countdown.hours).padStart(2, "0")}:
                {String(countdown.minutes).padStart(2, "0")}:{String(countdown.seconds).padStart(2, "0")}
              </div>
            </div>
          )}
        </div>
        <div className="z-10 relative">
          <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-surface-container flex items-center justify-center glow-gold relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-secondary-container/20 to-transparent" />
            <span className="material-symbols-outlined text-secondary-fixed icon-filled" style={{ fontSize: 120 }}>
              emoji_events
            </span>
          </div>
        </div>
      </section>

      {/* Meus Palpites & Ranking */}
      <div className="col-span-1 md:col-span-8 flex flex-col gap-gutter">
        <section className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2 m-0">
              <span className="material-symbols-outlined text-primary">sports_soccer</span>
              Meus Palpites
            </h3>
            <Link className="font-label-md text-label-md text-primary hover:text-primary-fixed transition-colors" to="/palpites">
              Ver todos
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {upcoming.map((game) => {
              const home = teamById.get(game.homeTeamId);
              const away = teamById.get(game.awayTeamId);
              const existing = pickByGameId.get(game.id);
              return (
                <div
                  key={game.id}
                  className="bg-surface-container/50 border border-white/10 rounded-xl p-5 hover:bg-surface-container transition-colors relative overflow-hidden"
                >
                  <div className="text-center font-label-md text-label-md text-on-surface-variant mb-4">
                    {new Date(game.kickoff).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 flex items-center justify-center text-2xl bg-surface-variant">
                        {home?.flag}
                      </div>
                      <span className="font-headline-md text-body-md text-on-surface font-bold">{home?.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-surface-container-high border border-white/20 rounded-lg text-center font-stats-xl text-headline-lg text-white flex items-center justify-center">
                        {existing?.homeScore ?? "-"}
                      </div>
                      <span className="text-on-surface-variant font-bold text-xl">X</span>
                      <div className="w-14 h-14 bg-surface-container-high border border-white/20 rounded-lg text-center font-stats-xl text-headline-lg text-white flex items-center justify-center">
                        {existing?.awayScore ?? "-"}
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 flex items-center justify-center text-2xl bg-surface-variant">
                        {away?.flag}
                      </div>
                      <span className="font-headline-md text-body-md text-on-surface font-bold">{away?.name}</span>
                    </div>
                  </div>
                  <Link
                    to="/palpites"
                    className="w-full block text-center py-2 bg-primary/20 text-primary border border-primary/50 hover:bg-primary hover:text-on-primary rounded-lg font-label-md text-label-md transition-all font-bold"
                  >
                    {existing ? "Editar Palpite" : "Fazer Palpite"}
                  </Link>
                </div>
              );
            })}
            {upcoming.length === 0 && <p className="text-on-surface-variant">Todos os jogos já têm resultado.</p>}
          </div>
        </section>

        <section className="glass-panel rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-tertiary-container/10 rounded-full blur-[80px] pointer-events-none" />
          <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2 mb-4 m-0">
            <span className="material-symbols-outlined text-secondary-fixed">leaderboard</span>
            Top Ranking Global
          </h3>
          <div className="flex items-end justify-center gap-2 md:gap-4 px-4 pb-4 pt-16">
            {podiumOrder.map((entry, i) => {
              if (!entry) return null;
              const place = i === 1 ? 1 : i === 0 ? 2 : 3;
              const color = place === 1 ? "#FFD700" : place === 2 ? "#C0C0C0" : "#CD7F32";
              const heightClass = place === 1 ? "h-32" : place === 2 ? "h-24" : "h-20";
              return (
                <div
                  key={entry.participantId}
                  className={`flex flex-col items-center w-1/3 z-10 relative ${place === 1 ? "-translate-y-4 z-20" : ""}`}
                >
                  {place === 1 && (
                    <span
                      className="material-symbols-outlined icon-filled text-secondary-fixed text-3xl absolute -top-10 animate-pulse"
                      style={{ filter: "drop-shadow(0 0 10px #ffe243)" }}
                    >
                      crown
                    </span>
                  )}
                  <Avatar
                    name={entry.participant.name}
                    className={`mb-2 ${place === 1 ? "w-16 h-16 md:w-20 md:h-20 text-xl" : "w-12 h-12 md:w-16 md:h-16"}`}
                    style={{ boxShadow: `0 0 15px ${color}66`, border: `2px solid ${color}` }}
                  />
                  <span className="font-label-md text-label-md text-on-surface font-bold truncate w-full text-center">
                    {entry.participant.name}
                  </span>
                  <Tooltip
                    className="inline-flex cursor-help"
                    panelClassName="w-56 text-left"
                    label={<PointsBreakdown entry={entry} />}
                  >
                    <span className="font-label-md text-[12px] text-on-surface-variant">{entry.total} pts</span>
                  </Tooltip>
                  <div
                    className={`w-full ${heightClass} bg-gradient-to-t from-surface-container-highest to-surface-container border-t rounded-t-lg mt-2 flex justify-center pt-2`}
                    style={{ borderColor: `${color}80` }}
                  >
                    <span className="font-stats-xl text-headline-md" style={{ color }}>
                      {place}
                    </span>
                  </div>
                </div>
              );
            })}
            {top3.length === 0 && <p className="text-on-surface-variant">Ninguém enviou palpites ainda.</p>}
          </div>
        </section>
      </div>

      {/* Conquistas & Departamentos */}
      <div className="col-span-1 md:col-span-4 flex flex-col gap-gutter">
        <aside className="glass-panel rounded-2xl p-6">
          <h3 className="font-headline-md text-body-lg text-on-surface flex items-center gap-2 mb-4 font-bold m-0">
            <span className="material-symbols-outlined text-tertiary-container">workspace_premium</span>
            Conquistas
          </h3>
          <div className="flex flex-wrap gap-4 justify-center">
            {badges.map((badge) => (
              <Tooltip key={badge.label} label={badge.tooltip}>
                <div className="flex flex-col items-center gap-2 group cursor-pointer">
                  <HexBadge icon={badge.icon} color={badge.color} active={badge.active} />
                  <span className="font-label-md text-[10px] text-on-surface-variant text-center leading-tight">{badge.label}</span>
                </div>
              </Tooltip>
            ))}
          </div>
        </aside>

        <aside className="glass-panel rounded-2xl p-6 flex-1">
          <h3 className="font-headline-md text-body-lg text-on-surface flex items-center gap-2 font-bold mb-6 m-0">
            <span className="material-symbols-outlined text-outline">corporate_fare</span>
            Departamentos
          </h3>
          <div className="space-y-6">
            {areas.map((area) => {
              const value = areaTotals[area] ?? 0;
              const isLeader = leaderArea === area;
              return (
                <div key={area}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-label-md text-label-md text-on-surface">{AREA_LABELS[area]}</span>
                      {isLeader && (
                        <span className="material-symbols-outlined icon-filled text-secondary-fixed text-[16px]">crown</span>
                      )}
                    </div>
                    <span className="font-label-md text-label-md text-on-surface-variant">{value} pts</span>
                  </div>
                  <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${AREA_BAR_COLOR[area]} rounded-full`}
                      style={{ width: `${(value / maxArea) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <Link
            to="/ranking"
            className="w-full mt-6 py-2 text-on-surface-variant font-label-md text-label-md border border-white/10 rounded-lg hover:bg-white/5 transition-colors block text-center"
          >
            Ver Ranking Completo
          </Link>
        </aside>
      </div>
    </div>
  );
}
