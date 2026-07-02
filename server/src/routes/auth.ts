import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../asyncHandler.js";
import { checkLoginRateLimit, signAdminToken, verifyAdminCredentials } from "../auth.js";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

authRouter.post(
  "/admin/login",
  asyncHandler(async (req, res) => {
    const ip = req.ip ?? "unknown";
    if (!checkLoginRateLimit(ip)) {
      res.status(429).json({ error: "Muitas tentativas de login — tente novamente em alguns minutos" });
      return;
    }

    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "E-mail ou senha inválidos" });
      return;
    }

    const valid = await verifyAdminCredentials(parsed.data.email, parsed.data.password);
    if (!valid) {
      res.status(401).json({ error: "E-mail ou senha incorretos" });
      return;
    }

    const token = await signAdminToken(parsed.data.email);
    res.json({ token, email: parsed.data.email });
  }),
);
