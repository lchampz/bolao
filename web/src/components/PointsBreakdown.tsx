import type { RankingEntry } from "../types";

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between gap-3">
      <span>{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

/** Como cada participante chegou ao total — usado no tooltip de Ranking e Dashboard. */
export function PointsBreakdown({ entry }: { entry: RankingEntry }) {
  return (
    <div className="space-y-1 font-label-md normal-case font-normal">
      <Row label="Jogos" value={entry.gamePoints} />
      <Row label="Bônus de fase" value={entry.phaseBonusPoints} />
      <Row label="Campeão" value={entry.championBonusPoints} />
      <Row label="Madrugador" value={entry.earlyBirdPoints} />
      <Row label="Sequência" value={entry.streakPoints} />
      <Row label="Rodada" value={entry.roundHighScorePoints} />
      <div className="flex justify-between gap-3 pt-1 border-t border-white/10">
        <span>Total</span>
        <span className="font-bold text-primary">{entry.total}</span>
      </div>
    </div>
  );
}
