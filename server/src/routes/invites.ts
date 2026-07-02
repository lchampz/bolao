import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../asyncHandler.js";
import { createParticipant, getInviteByToken, markInviteAccepted } from "../repo.js";

export const invitesRouter = Router();

invitesRouter.get(
  "/invites/:token",
  asyncHandler(async (req, res) => {
    const invite = await getInviteByToken(req.params.token);
    if (!invite) {
      res.status(404).json({ error: "Convite não encontrado ou inválido" });
      return;
    }
    res.json({ email: invite.email, status: invite.status });
  }),
);

const acceptSchema = z.object({
  name: z.string().trim().min(2).max(80),
  area: z.enum(["RH", "TI", "FINANCEIRO", "OUTRA"]),
});

// HU-01.1 (refinamento) — aceitar o convite cria o participante vinculado ao
// e-mail convidado (o e-mail nunca é digitado pelo usuário, vem do convite).
invitesRouter.post(
  "/invites/:token/accept",
  asyncHandler(async (req, res) => {
    const invite = await getInviteByToken(req.params.token);
    if (!invite) {
      res.status(404).json({ error: "Convite não encontrado ou inválido" });
      return;
    }
    if (invite.status === "ACCEPTED") {
      res.status(409).json({ error: "Este convite já foi utilizado" });
      return;
    }

    const parsed = acceptSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const participant = {
      id: randomUUID(),
      name: parsed.data.name,
      area: parsed.data.area,
      email: invite.email,
      createdAt: new Date().toISOString(),
    };
    await createParticipant(participant);
    await markInviteAccepted(invite.id, participant.id);
    res.status(201).json(participant);
  }),
);
