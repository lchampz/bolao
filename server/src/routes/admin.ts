import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../asyncHandler.js";
import { requireAdmin } from "../auth.js";
import { parseEmailsFromCsv } from "../csv.js";
import { syncFixtures } from "../fixtures.js";
import { sendInviteEmail } from "../mailer.js";
import {
  getConfig,
  getGame,
  getInviteById,
  getInvites,
  getLastSyncedAt,
  setConfig,
  setGameResult,
  upsertInvite,
} from "../repo.js";

export const adminRouter = Router();

// Todas as rotas abaixo exigem login de administrador (ver server/src/auth.ts).
adminRouter.use(requireAdmin);

// --- sincronização de fixtures ------------------------------------------

// Sincronização automática de fixtures/resultados reais (ver server/src/fixtures.ts).
// Roda no boot e a cada N minutos; este endpoint só permite disparar manualmente.
adminRouter.post(
  "/admin/sync",
  asyncHandler(async (_req, res) => {
    try {
      const result = await syncFixtures();
      res.json(result);
    } catch (err) {
      res.status(502).json({ error: `Falha ao sincronizar: ${(err as Error).message}` });
    }
  }),
);

adminRouter.get(
  "/admin/sync",
  asyncHandler(async (_req, res) => {
    res.json({ lastSyncedAt: await getLastSyncedAt() });
  }),
);

// --- resultado manual (reserva) ------------------------------------------

const resultSchema = z.object({
  officialHome: z.number().int().min(0).max(30),
  officialAway: z.number().int().min(0).max(30),
  wentToPenalties: z.boolean().default(false),
  penaltyWinnerTeamId: z.string().nullable().default(null),
});

// HU-03.3 — lançamento do resultado oficial de uma partida.
adminRouter.post(
  "/admin/games/:id/result",
  asyncHandler(async (req, res) => {
    const game = await getGame(req.params.id);
    if (!game) {
      res.status(404).json({ error: "Jogo não encontrado" });
      return;
    }
    const parsed = resultSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    if (parsed.data.wentToPenalties && !parsed.data.penaltyWinnerTeamId) {
      res.status(400).json({ error: "penaltyWinnerTeamId é obrigatório quando houve pênaltis" });
      return;
    }

    await setGameResult(
      game.id,
      parsed.data.officialHome,
      parsed.data.officialAway,
      parsed.data.wentToPenalties,
      parsed.data.penaltyWinnerTeamId,
    );
    res.json(await getGame(game.id));
  }),
);

// --- configurações ---------------------------------------------------------

adminRouter.get(
  "/admin/config",
  asyncHandler(async (_req, res) => {
    res.json(await getConfig());
  }),
);

// HU-04.3 (refinamento) — janela de antecedência configurável, sem deploy.
const configSchema = z.object({ antecedenciaMinutos: z.number().int().min(0).max(1440) });
adminRouter.put(
  "/admin/config",
  asyncHandler(async (req, res) => {
    const parsed = configSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    await setConfig(parsed.data);
    res.json(await getConfig());
  }),
);

// --- convites ---------------------------------------------------------

const emailSchema = z.string().trim().email();

async function createAndSend(email: string) {
  const { invite, alreadyAccepted } = await upsertInvite(email);
  let emailError: string | null = null;
  if (!alreadyAccepted) {
    try {
      await sendInviteEmail(invite.email, invite.token);
    } catch (err) {
      // O convite já foi salvo — um erro de envio (ex. remetente não
      // verificado no Brevo) não deve derrubar a criação. Reenviar
      // continua disponível depois de corrigir a configuração de e-mail.
      emailError = (err as Error).message;
      console.error(`[invites] falha ao enviar e-mail para ${email}:`, emailError);
    }
  }
  return { invite, alreadyAccepted, emailError };
}

adminRouter.get(
  "/admin/invites",
  asyncHandler(async (_req, res) => {
    res.json(await getInvites());
  }),
);

// HU-01.1 (refinamento) — convite unitário por e-mail.
adminRouter.post(
  "/admin/invites",
  asyncHandler(async (req, res) => {
    const parsed = emailSchema.safeParse(req.body.email);
    if (!parsed.success) {
      res.status(400).json({ error: "E-mail inválido" });
      return;
    }
    const { invite, alreadyAccepted, emailError } = await createAndSend(parsed.data);
    if (alreadyAccepted) {
      res.status(409).json({ error: "Este e-mail já está cadastrado no bolão" });
      return;
    }
    res.status(201).json({ ...invite, emailError });
  }),
);

// HU-01.1 (refinamento) — importação em massa via CSV (uma coluna de e-mails,
// com ou sem cabeçalho). O front lê o arquivo e manda o texto bruto aqui.
const bulkSchema = z.object({ csv: z.string().min(1) });
adminRouter.post(
  "/admin/invites/bulk",
  asyncHandler(async (req, res) => {
    const parsed = bulkSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Envie { csv: string }" });
      return;
    }

    const emails = parseEmailsFromCsv(parsed.data.csv);
    const results = { created: 0, resent: 0, alreadyAccepted: 0, emailFailures: 0, total: emails.length };
    for (const email of emails) {
      const { alreadyAccepted, emailError } = await createAndSend(email);
      if (alreadyAccepted) results.alreadyAccepted++;
      else {
        results.created++;
        if (emailError) results.emailFailures++;
      }
    }
    res.status(201).json(results);
  }),
);

adminRouter.post(
  "/admin/invites/:id/resend",
  asyncHandler(async (req, res) => {
    const invite = await getInviteById(req.params.id);
    if (!invite) {
      res.status(404).json({ error: "Convite não encontrado" });
      return;
    }
    if (invite.status === "ACCEPTED") {
      res.status(409).json({ error: "Este convite já foi aceito" });
      return;
    }
    try {
      await sendInviteEmail(invite.email, invite.token);
    } catch (err) {
      res.status(502).json({ error: `Falha ao enviar e-mail: ${(err as Error).message}` });
      return;
    }
    res.json({ ok: true });
  }),
);
