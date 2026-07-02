import { useEffect, useState } from "react";
import { api } from "../api";
import { AREA_LABELS, type Area } from "../types";

const AREA_BAR_COLOR: Record<Area, string> = {
  TI: "from-on-tertiary-container to-primary shadow-[0_0_10px_theme('colors.primary')]",
  RH: "from-tertiary-container to-tertiary",
  FINANCEIRO: "from-secondary-fixed-dim to-secondary-fixed",
  OUTRA: "from-surface-variant to-surface-variant",
};

export default function Departments() {
  const [totals, setTotals] = useState<Record<string, number>>({});

  useEffect(() => {
    api.getAreaRanking().then(setTotals);
  }, []);

  const max = Math.max(1, ...Object.values(totals));
  const areas = Object.keys(AREA_LABELS) as Area[];
  const leader = areas.reduce<Area | null>((best, area) => {
    if (!totals[area]) return best;
    if (!best || totals[area] > (totals[best] ?? 0)) return area;
    return best;
  }, null);

  return (
    <div className="flex flex-col gap-gutter max-w-3xl">
      <section className="glass-panel rounded-2xl p-8">
        <h2 className="font-headline-lg text-headline-lg text-on-surface flex items-center gap-2 m-0">
          <span className="material-symbols-outlined text-secondary-fixed text-3xl">corporate_fare</span>
          Competição entre Áreas
        </h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">
          Pontuação agregada de todos os participantes de cada área.
        </p>

        <div className="space-y-8 mt-8">
          {areas.map((area) => {
            const value = totals[area] ?? 0;
            const isLeader = leader === area;
            return (
              <div key={area}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-headline-md text-headline-md text-on-surface m-0">{AREA_LABELS[area]}</span>
                    {isLeader && <span className="material-symbols-outlined icon-filled text-secondary-fixed">crown</span>}
                  </div>
                  <span className="font-stats-xl text-xl text-primary font-black">{value} pts</span>
                </div>
                <div className="w-full h-3 bg-surface-container-highest rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${AREA_BAR_COLOR[area]} rounded-full transition-all duration-500`}
                    style={{ width: `${(value / max) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
