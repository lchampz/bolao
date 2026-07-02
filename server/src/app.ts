import cors from "cors";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { configRouter } from "./routes/config.js";
import { gamesRouter } from "./routes/games.js";
import { invitesRouter } from "./routes/invites.js";
import { loginRouter } from "./routes/login.js";
import { participantsRouter } from "./routes/participants.js";
import { picksRouter } from "./routes/picks.js";
import { prizesRouter } from "./routes/prizes.js";
import { rankingRouter } from "./routes/ranking.js";

// O `fromService` do Render só expõe o host (sem protocolo) — completa aqui.
const rawAllowedOrigin = process.env.ALLOWED_ORIGIN;
const allowedOrigin =
  rawAllowedOrigin && !rawAllowedOrigin.startsWith("http") ? `https://${rawAllowedOrigin}` : rawAllowedOrigin;

export const app = express();
app.use(cors(allowedOrigin ? { origin: allowedOrigin } : {}));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api", authRouter);
app.use("/api", configRouter);
app.use("/api", gamesRouter);
app.use("/api", participantsRouter);
app.use("/api", invitesRouter);
app.use("/api", loginRouter);
app.use("/api", picksRouter);
app.use("/api", adminRouter);
app.use("/api", rankingRouter);
app.use("/api", prizesRouter);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Erro interno" });
});
