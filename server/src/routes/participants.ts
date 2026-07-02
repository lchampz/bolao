import { Router } from "express";
import { asyncHandler } from "../asyncHandler.js";
import { getParticipants } from "../repo.js";

export const participantsRouter = Router();

participantsRouter.get(
  "/participants",
  asyncHandler(async (_req, res) => {
    res.json(await getParticipants());
  }),
);
