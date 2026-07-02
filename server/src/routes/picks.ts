import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../asyncHandler.js";
import { getGame, getPicksForParticipant, upsertPick } from "../repo.js";

export const picksRouter = Router();

const pickSchema = z.object({
  participantId: z.string().min(1),
  gameId: z.string().min(1),
  homeScore: z.number().int().min(0).max(30),
  awayScore: z.number().int().min(0).max(30),
});

picksRouter.get(
  "/picks",
  asyncHandler(async (req, res) => {
    const participantId = String(req.query.participantId ?? "");
    if (!participantId) {
      res.status(400).json({ error: "participantId é obrigatório" });
      return;
    }
    res.json(await getPicksForParticipant(participantId));
  }),
);

// HU-02.1 / HU-02.2 — envia ou edita um palpite, sempre antes do início do jogo.
picksRouter.post(
  "/picks",
  asyncHandler(async (req, res) => {
    const parsed = pickSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const game = await getGame(parsed.data.gameId);
    if (!game) {
      res.status(404).json({ error: "Jogo não encontrado" });
      return;
    }
    if (game.finished || Date.now() >= new Date(game.kickoff).getTime()) {
      res.status(409).json({ error: "Prazo para este jogo já encerrou" });
      return;
    }

    const pick = {
      id: randomUUID(),
      participantId: parsed.data.participantId,
      gameId: parsed.data.gameId,
      homeScore: parsed.data.homeScore,
      awayScore: parsed.data.awayScore,
      submittedAt: new Date().toISOString(),
    };
    await upsertPick(pick);
    res.status(201).json(pick);
  }),
);
