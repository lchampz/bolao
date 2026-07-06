import { useEffect, useState } from "react";
import { api } from "../api";
import { Avatar } from "../components/Avatar";
import { Modal } from "../components/Modal";
import { PointsBreakdown } from "../components/PointsBreakdown";
import { Tooltip } from "../components/Tooltip";
import { AREA_LABELS, type Prize, type RankingEntry } from "../types";

const AREA_CHIP: Record<string, string> = {
  TI: "bg-error-container/20 text-error",
  RH: "bg-primary-container/20 text-primary-fixed",
  FINANCEIRO: "bg-tertiary-container/20 text-tertiary-fixed",
  OUTRA: "bg-surface-variant/40 text-on-surface-variant",
};

const CRITERIA = [
  { icon: "done_all", iconColor: "text-primary", title: "Placar Exato", desc: "Maior número de palpites com placar exato." },
  { icon: "emoji_events", iconColor: "text-secondary-fixed", title: "Vencedor Correto", desc: "Maior número de acertos do time vencedor." },
  { icon: "military_tech", iconColor: "text-secondary-fixed", title: "Acerto do Campeão", desc: "Quem acertou o campeão da Copa." },
  { icon: "timer", iconColor: "text-tertiary-fixed", title: "Velocidade do Palpite", desc: "Quem enviou o palpite primeiro para o sistema." },
];

// Espelha as constantes de server/src/scoring.ts — só para exibição no
// modal de regras, não recalcula pontuação (isso é feito no backend).
const PHASE_CAPS = { OITAVAS: 3, QUARTAS: 4, SEMIFINAL: 5 };
const CHAMPION_BONUS = 6;
const ROUND_HIGH_SCORE_BONUS = 2;
const STREAK_BONUS = 2;
const STREAK_LENGTH = 3;

export default function Ranking() {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [antecedenciaMinutos, setAntecedenciaMinutos] = useState(120);
  const [rulesOpen, setRulesOpen] = useState(false);

  useEffect(() => {
    api.getRanking().then(setRanking);
    api.getPrizes().then(setPrizes);
    api.getConfig().then((c) => setAntecedenciaMinutos(c.antecedenciaMinutos));
  }, []);

  const top3 = ranking.slice(0, 3);
  const rest = ranking.slice(3);
  const order = [top3[1], top3[0], top3[2]];
  const podiumMeta = [
    { place: "2nd", color: "#C0C0C0", avatarClass: "w-16 h-16 sm:w-20 sm:h-20 avatar-glow-2", blockClass: "podium-2 h-24 sm:h-32", size: "text-4xl" },
    { place: "1st", color: "#FFD700", avatarClass: "w-20 h-20 sm:w-28 sm:h-28 avatar-glow-1", blockClass: "podium-1 h-36 sm:h-48", size: "text-5xl" },
    { place: "3rd", color: "#CD7F32", avatarClass: "w-16 h-16 sm:w-20 sm:h-20 avatar-glow-3", blockClass: "podium-3 h-20 sm:h-24", size: "text-4xl" },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1 flex flex-col gap-8">
        {/* Podium */}
        <section className="glass-card rounded-xl p-8 relative overflow-hidden flex flex-col items-center justify-end min-h-[400px]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
          <h2 className="font-headline-lg text-headline-lg font-bold text-center mb-auto pt-4 relative z-10 text-white m-0">
            Ranking Global
          </h2>
          <div className="flex items-end justify-center gap-2 sm:gap-6 mt-12 w-full max-w-2xl relative z-10">
            {order.map((entry, i) => {
              if (!entry) return null;
              const meta = podiumMeta[i];
              return (
                <div key={entry.participantId} className={`flex flex-col items-center w-1/3 ${i === 1 ? "-mt-12 z-10" : ""}`}>
                  <div className="relative mb-4">
                    <Avatar name={entry.participant.name} className={meta.avatarClass} />
                    <div
                      className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-black font-bold text-xs px-2 py-1 rounded-full border border-black/20 shadow-md"
                      style={{ backgroundColor: meta.color }}
                    >
                      {meta.place}
                    </div>
                  </div>
                  <div className="text-center mb-4">
                    <div className="font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px]">
                      {entry.participant.name}
                    </div>
                    <div className="text-secondary-fixed text-sm font-bold">{entry.total} pts</div>
                  </div>
                  <div className={`w-full rounded-t-xl flex justify-center items-start pt-4 border-t ${meta.blockClass}`} style={{ borderColor: `${meta.color}80` }}>
                    <span className={`material-symbols-outlined icon-filled ${meta.size}`} style={{ color: meta.color }}>
                      emoji_events
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Table */}
        <section className="glass-card rounded-xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-surface-container/50">
            <h3 className="font-headline-md text-headline-md font-bold text-white m-0">Classificação Geral</h3>
            <button
              onClick={() => setRulesOpen(true)}
              className="text-sm font-bold text-primary hover:text-primary-fixed transition-colors flex items-center gap-1"
            >
              Ver Regras <span className="material-symbols-outlined text-sm">open_in_new</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-surface-container-highest/30 text-on-surface-variant font-label-md border-b border-white/5 uppercase tracking-wider text-xs">
                  <th className="p-4 w-16 text-center">Pos</th>
                  <th className="p-4">Participante</th>
                  <th className="p-4">Depto</th>
                  <th className="p-4 text-center">Placar Exato</th>
                  <th className="p-4 text-center">Vencedor</th>
                  <th className="p-4 text-center">Sequência</th>
                  <th className="p-4 text-right font-bold text-primary">Pontos</th>
                </tr>
              </thead>
              <tbody>
                {rest.map((entry, i) => (
                  <tr key={entry.participantId} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${i % 2 === 1 ? "bg-white/[0.02]" : ""}`}>
                    <td className="p-4 text-center font-bold text-white">
                      {entry.position}
                      {entry.tied && <span className="text-on-surface-variant text-xs"> (empate)</span>}
                    </td>
                    <td className="p-4 flex items-center gap-3">
                      <Avatar name={entry.participant.name} className="w-8 h-8 text-xs" />
                      <span className="font-bold text-white">{entry.participant.name}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${AREA_CHIP[entry.participant.area]}`}>
                        {AREA_LABELS[entry.participant.area]}
                      </span>
                    </td>
                    <td className="p-4 text-center font-label-md">{entry.exactCount}</td>
                    <td className="p-4 text-center font-label-md">{entry.winnerCorrectCount}</td>
                    <td className="p-4 text-center">
                      <div className={`flex items-center justify-center gap-1 ${entry.streakPoints > 0 ? "text-orange-400" : "text-on-surface-variant/50"}`}>
                        <span className="material-symbols-outlined icon-filled text-sm">local_fire_department</span>
                        <span className="font-bold text-xs">{entry.streakPoints > 0 ? entry.streakPoints : "-"}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right font-stats-xl text-xl text-primary font-black">
                      <Tooltip
                        className="inline-flex justify-end cursor-help"
                        panelClassName="w-56 text-left"
                        placement="bottom"
                        align="right"
                        label={<PointsBreakdown entry={entry} />}
                      >
                        {entry.total}
                      </Tooltip>
                    </td>
                  </tr>
                ))}
                {ranking.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-4 text-on-surface-variant text-center">
                      Ninguém enviou palpites ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Critérios de Desempate */}
      <div className="lg:w-80 flex flex-col gap-8">
        <aside className="glass-card rounded-xl p-6 border-t-4 border-t-secondary-fixed">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-secondary-fixed text-3xl">gavel</span>
            <h3 className="font-headline-md text-headline-md font-bold text-white m-0">Critérios de Desempate</h3>
          </div>
          <div className="space-y-4">
            {CRITERIA.map((c, i) => (
              <div className="flex gap-4 items-start" key={c.title}>
                <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center shrink-0 border border-white/10 text-primary text-sm font-bold">
                  {i + 1}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm mb-1 flex items-center gap-1">
                    <span className={`material-symbols-outlined text-sm ${c.iconColor}`}>{c.icon}</span> {c.title}
                  </h4>
                  <p className="text-xs text-on-surface-variant">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <aside className="glass-card rounded-xl p-6">
          <h3 className="font-headline-md text-body-lg font-bold text-white mb-4 flex items-center gap-2 m-0">
            🏁 Premiação
          </h3>
          <div className="space-y-3">
            {prizes.map((p) => (
              <div key={p.position} className="flex items-center gap-3 bg-surface-container/50 rounded-lg p-3">
                <span className="text-2xl">{p.position === 1 ? "🥇" : p.position === 2 ? "🥈" : "🥉"}</span>
                <span className="text-sm text-on-surface-variant">{p.description}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <Modal open={rulesOpen} onClose={() => setRulesOpen(false)} title="🏆 Como funciona a pontuação">
        <div className="space-y-5 text-sm text-on-surface-variant">
          <section>
            <h4 className="text-white font-bold mb-2">Por palpite</h4>
            <ul className="space-y-1">
              <li>
                <span className="text-primary font-bold">+3</span> — placar exato
              </li>
              <li>
                <span className="text-primary font-bold">+2</span> — só o vencedor certo (placar errado)
              </li>
              <li>
                <span className="text-on-surface-variant/60 font-bold">0</span> — errou o vencedor
              </li>
            </ul>
          </section>

          <section>
            <h4 className="text-white font-bold mb-2">Bônus</h4>
            <ul className="space-y-2">
              <li>
                <span className="text-primary font-bold">+1</span> por classificado certo em cada fase, até um teto —
                Oitavas ({PHASE_CAPS.OITAVAS}), Quartas ({PHASE_CAPS.QUARTAS}), Semifinal ({PHASE_CAPS.SEMIFINAL}).
              </li>
              <li>
                <span className="text-primary font-bold">+{CHAMPION_BONUS}</span> — acertar o campeão da Copa (o
                vencedor da Final).
              </li>
              <li>
                <span className="text-primary font-bold">+1</span> por palpite enviado com pelo menos{" "}
                <strong className="text-white">{antecedenciaMinutos} minutos</strong> de antecedência do jogo
                ("Madrugador").
              </li>
              <li>
                <span className="text-primary font-bold">+{STREAK_BONUS}</span> a cada {STREAK_LENGTH} acertos de
                vencedor consecutivos (na ordem dos jogos) — quebra a sequência no primeiro erro.
              </li>
              <li>
                <span className="text-primary font-bold">+{ROUND_HIGH_SCORE_BONUS}</span> para quem fizer a maior
                pontuação da rodada, quando todos os jogos dela já tiverem resultado (todos os empatados no topo
                recebem).
              </li>
            </ul>
          </section>

          <section>
            <h4 className="text-white font-bold mb-2">Critérios de desempate</h4>
            <p className="mb-2">Em ordem, até desempatar:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Total de pontos</li>
              <li>Mais placares exatos</li>
              <li>Mais acertos de vencedor</li>
              <li>Acertou o campeão</li>
              <li>Mais pontos de bônus de fase</li>
              <li>Quem enviou o palpite primeiro</li>
            </ol>
          </section>
        </div>
      </Modal>
    </div>
  );
}
