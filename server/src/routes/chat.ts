import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../asyncHandler.js";
import { createMessage, getMessages, getParticipant, touchParticipantLastSeen } from "../repo.js";

export const chatRouter = Router();

const MESSAGE_MAX_LENGTH = 500;
const MESSAGE_RATE_LIMIT = 5;
const MESSAGE_RATE_WINDOW_MS = 10_000;

// Limitador simples em memória — mesmo padrão de server/src/auth.ts, suficiente
// para um chat interno de baixo tráfego.
const messageBuckets = new Map<string, { count: number; resetAt: number }>();

function checkMessageRateLimit(participantId: string): boolean {
  const now = Date.now();
  const entry = messageBuckets.get(participantId);
  if (!entry || now > entry.resetAt) {
    messageBuckets.set(participantId, { count: 1, resetAt: now + MESSAGE_RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= MESSAGE_RATE_LIMIT) return false;
  entry.count++;
  return true;
}

chatRouter.get(
  "/chat/messages",
  asyncHandler(async (_req, res) => {
    res.json(await getMessages());
  }),
);

const postSchema = z.object({
  participantId: z.string().min(1),
  content: z.string().trim().min(1).max(MESSAGE_MAX_LENGTH),
});

chatRouter.post(
  "/chat/messages",
  asyncHandler(async (req, res) => {
    const parsed = postSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: `Mensagem inválida (1 a ${MESSAGE_MAX_LENGTH} caracteres)` });
      return;
    }

    const participant = await getParticipant(parsed.data.participantId);
    if (!participant) {
      res.status(404).json({ error: "Participante não encontrado" });
      return;
    }
    if (!checkMessageRateLimit(participant.id)) {
      res.status(429).json({ error: "Você está enviando mensagens rápido demais — espere um instante" });
      return;
    }

    const message = {
      id: randomUUID(),
      participantId: participant.id,
      content: parsed.data.content,
      createdAt: new Date().toISOString(),
    };
    await createMessage(message);
    await touchParticipantLastSeen(participant.id);
    res.status(201).json({ ...message, participantName: participant.name, participantArea: participant.area });
  }),
);

const pingSchema = z.object({ participantId: z.string().min(1) });

// Heartbeat de presença (online/offline) — ver web/src/context/ParticipantContext.tsx.
chatRouter.post(
  "/presence/ping",
  asyncHandler(async (req, res) => {
    const parsed = pingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "participantId é obrigatório" });
      return;
    }
    await touchParticipantLastSeen(parsed.data.participantId);
    res.json({ ok: true });
  }),
);
