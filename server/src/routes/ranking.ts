import { Router } from "express";
import { asyncHandler } from "../asyncHandler.js";
import { computeBreakdowns, rankBreakdowns } from "../scoring.js";
import { getConfig, getGames, getParticipants, getPicks } from "../repo.js";
import type { Area } from "../types.js";

export const rankingRouter = Router();

async function buildRanking() {
  const [participants, games, picks, config] = await Promise.all([
    getParticipants(),
    getGames(),
    getPicks(),
    getConfig(),
  ]);
  const breakdowns = computeBreakdowns({ participants, games, picks, config });
  return { ranked: rankBreakdowns(breakdowns), participants };
}

// HU-05.1 / HU-05.2 — ranking geral com desempate em cascata.
rankingRouter.get(
  "/ranking",
  asyncHandler(async (_req, res) => {
    const { ranked, participants } = await buildRanking();
    const byId = new Map(participants.map((p) => [p.id, p]));
    res.json(ranked.map((r) => ({ ...r, participant: byId.get(r.participantId) })));
  }),
);

// HU-09.2 — competição entre áreas.
rankingRouter.get(
  "/ranking/areas",
  asyncHandler(async (_req, res) => {
    const { ranked, participants } = await buildRanking();
    const byId = new Map(participants.map((p) => [p.id, p]));
    const totals = new Map<Area, number>();
    for (const r of ranked) {
      const area = byId.get(r.participantId)?.area;
      if (!area) continue;
      totals.set(area, (totals.get(area) ?? 0) + r.total);
    }
    res.json(Object.fromEntries(totals));
  }),
);
