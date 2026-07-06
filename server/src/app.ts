import cors from "cors";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { chatRouter } from "./routes/chat.js";
import { configRouter } from "./routes/config.js";
import { gamesRouter } from "./routes/games.js";
import { invitesRouter } from "./routes/invites.js";
import { loginRouter } from "./routes/login.js";
import { participantsRouter } from "./routes/participants.js";
import { picksRouter } from "./routes/picks.js";
import { prizesRouter } from "./routes/prizes.js";
import { rankingRouter } from "./routes/ranking.js";

// O `fromService`/`property: host` do Render devolve só o slug do serviço
// (ex. "bolao-web-d8bw"), sem o domínio ".onrender.com" — sem isso o CORS
// compara contra um host que não existe e bloqueia tudo.
function resolveRenderHost(raw: string | undefined): string | undefined {
  if (!raw || raw.startsWith("http")) return raw;
  const withDomain = raw.includes(".") ? raw : `${raw}.onrender.com`;
  return `https://${withDomain}`;
}
const allowedOrigin = resolveRenderHost(process.env.ALLOWED_ORIGIN);

export const app = express();
app.use(cors(allowedOrigin ? { origin: allowedOrigin } : {}));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api", authRouter);
app.use("/api", chatRouter);
app.use("/api", configRouter);
app.use("/api", gamesRouter);
app.use("/api", participantsRouter);
app.use("/api", invitesRouter);
app.use("/api", loginRouter);
app.use("/api", picksRouter);
app.use("/api", rankingRouter);
app.use("/api", prizesRouter);
// adminRouter tem que ser o último — seu `.use(requireAdmin)` não tem path
// restrito, então intercepta QUALQUER request que chegue até ele. Montado
// antes de ranking/prizes, ele derrubava essas rotas públicas com 401 antes
// de elas serem alcançadas.
app.use("/api", adminRouter);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Erro interno" });
});
