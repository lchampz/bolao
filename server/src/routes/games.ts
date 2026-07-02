import { Router } from "express";
import { asyncHandler } from "../asyncHandler.js";
import { getGames, getTeams } from "../repo.js";

export const gamesRouter = Router();

gamesRouter.get(
  "/teams",
  asyncHandler(async (_req, res) => {
    res.json(await getTeams());
  }),
);

gamesRouter.get(
  "/games",
  asyncHandler(async (_req, res) => {
    res.json(await getGames());
  }),
);
