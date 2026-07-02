import { Router } from "express";

export const prizesRouter = Router();

// HU-06.1 — prêmios fixos do regulamento.
prizesRouter.get("/prizes", (_req, res) => {
  res.json([
    { position: 1, description: "Vale-presente (R$300,00) ou 1 Day Off" },
    { position: 2, description: "Vale-presente (R$200,00)" },
    { position: 3, description: "Vale-presente (R$100,00)" },
  ]);
});
