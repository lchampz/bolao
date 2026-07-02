import { Router } from "express";
import { asyncHandler } from "../asyncHandler.js";
import { getConfig } from "../repo.js";

export const configRouter = Router();

// Leitura pública — ex. o tooltip do badge "Madrugador" no Dashboard precisa
// saber a janela de antecedência atual. Só a alteração (PUT) é admin-only,
// em routes/admin.ts.
configRouter.get(
  "/config",
  asyncHandler(async (_req, res) => {
    res.json(await getConfig());
  }),
);
