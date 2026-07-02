import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../asyncHandler.js";
import {
  checkLoginLinkRateLimit,
  isAdminEmail,
  signParticipantLoginToken,
  verifyParticipantLoginToken,
} from "../auth.js";
import { sendLoginLinkEmail } from "../mailer.js";
import { getParticipantByEmail } from "../repo.js";

export const loginRouter = Router();

const emailSchema = z.object({ email: z.string().trim().email() });

/**
 * Ponto de entrada único da tela de login (participante ou admin) —
 * identifica o e-mail e diz ao front o que mostrar a seguir:
 * - "admin": revela o campo de senha (login continua em POST /admin/login).
 * - "participant": já disparou o e-mail com o link de acesso.
 * - "unknown": e-mail sem cadastro — não envia nada (convite é só via admin).
 * Nunca revela por que é um ou outro além do necessário para a UI seguir.
 */
loginRouter.post(
  "/login/start",
  asyncHandler(async (req, res) => {
    const ip = req.ip ?? "unknown";
    if (!checkLoginLinkRateLimit(ip)) {
      res.status(429).json({ error: "Muitas tentativas — tente novamente em alguns minutos" });
      return;
    }

    const parsed = emailSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "E-mail inválido" });
      return;
    }
    const email = parsed.data.email;

    if (await isAdminEmail(email)) {
      res.json({ type: "admin" });
      return;
    }

    const participant = await getParticipantByEmail(email);
    if (participant) {
      const token = await signParticipantLoginToken(participant.email!);
      await sendLoginLinkEmail(participant.email!, token);
      res.json({ type: "participant" });
      return;
    }

    res.json({ type: "unknown" });
  }),
);

const tokenSchema = z.object({ token: z.string().min(1) });

loginRouter.post(
  "/login/verify",
  asyncHandler(async (req, res) => {
    const parsed = tokenSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Link inválido" });
      return;
    }

    const email = await verifyParticipantLoginToken(parsed.data.token);
    if (!email) {
      res.status(401).json({ error: "Link inválido ou expirado — peça um novo" });
      return;
    }

    const participant = await getParticipantByEmail(email);
    if (!participant) {
      res.status(404).json({ error: "Participante não encontrado" });
      return;
    }
    res.json(participant);
  }),
);
