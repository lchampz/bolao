import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import { pool } from "./db.js";

const TOKEN_TTL = "24h";
const LOGIN_RATE_LIMIT = 10;
const LOGIN_RATE_WINDOW_MS = 15 * 60_000;

async function getConfigValue(key: string): Promise<string | null> {
  const { rows } = await pool.query("SELECT value FROM config WHERE key = $1", [key]);
  return rows[0]?.value ?? null;
}

async function setConfigValue(key: string, value: string): Promise<void> {
  await pool.query(
    "INSERT INTO config (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
    [key, value],
  );
}

let cachedJwtSecret: string | null = null;

async function getJwtSecret(): Promise<string> {
  if (cachedJwtSecret) return cachedJwtSecret;
  if (process.env.JWT_SECRET) {
    cachedJwtSecret = process.env.JWT_SECRET;
    return cachedJwtSecret;
  }
  let secret = await getConfigValue("jwtSecret");
  if (!secret) {
    secret = randomBytes(32).toString("hex");
    await setConfigValue("jwtSecret", secret);
  }
  cachedJwtSecret = secret;
  return secret;
}

/**
 * Credencial de admin vem de ADMIN_EMAIL/ADMIN_PASSWORD (env) — chamado no
 * boot. Se as env vars mudarem, a credencial é re-hasheada no próximo boot.
 * Sem env vars e sem credencial existente, gera uma senha aleatória e loga
 * uma única vez (não fica sem admin nenhum, mas o ideal é sempre configurar
 * as env vars). Ver docs/DEPLOY.md.
 */
export async function ensureAdminAccount(): Promise<void> {
  const envEmail = process.env.ADMIN_EMAIL;
  const envPassword = process.env.ADMIN_PASSWORD;

  if (envEmail && envPassword) {
    const hash = await bcrypt.hash(envPassword, 10);
    await setConfigValue("adminEmail", envEmail.toLowerCase());
    await setConfigValue("adminPasswordHash", hash);
    return;
  }

  const existing = await getConfigValue("adminEmail");
  if (existing) return;

  const generatedPassword = randomBytes(9).toString("base64url");
  const hash = await bcrypt.hash(generatedPassword, 10);
  await setConfigValue("adminEmail", "admin@bolao.local");
  await setConfigValue("adminPasswordHash", hash);
  console.log(
    `[auth] ADMIN_EMAIL/ADMIN_PASSWORD não configurados — credencial gerada: admin@bolao.local / ${generatedPassword}`,
  );
}

export async function isAdminEmail(email: string): Promise<boolean> {
  const storedEmail = await getConfigValue("adminEmail");
  return !!storedEmail && email.toLowerCase() === storedEmail;
}

export async function verifyAdminCredentials(email: string, password: string): Promise<boolean> {
  const storedEmail = await getConfigValue("adminEmail");
  const storedHash = await getConfigValue("adminPasswordHash");
  if (!storedEmail || !storedHash) return false;
  if (email.toLowerCase() !== storedEmail) return false;
  return bcrypt.compare(password, storedHash);
}

export async function signAdminToken(email: string): Promise<string> {
  const secret = await getJwtSecret();
  return jwt.sign({ role: "admin", email }, secret, { expiresIn: TOKEN_TTL });
}

const LOGIN_LINK_TTL = "15m";

/** Link de "esqueci minha sessão" para participantes — ver routes/login.ts. */
export async function signParticipantLoginToken(email: string): Promise<string> {
  const secret = await getJwtSecret();
  return jwt.sign({ role: "participant-login", email }, secret, { expiresIn: LOGIN_LINK_TTL });
}

export async function verifyParticipantLoginToken(token: string): Promise<string | null> {
  try {
    const secret = await getJwtSecret();
    const payload = jwt.verify(token, secret);
    if (typeof payload !== "object" || payload.role !== "participant-login" || typeof payload.email !== "string") {
      return null;
    }
    return payload.email;
  } catch {
    return null;
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "Login de administrador necessário" });
    return;
  }
  try {
    const secret = await getJwtSecret();
    const payload = jwt.verify(token, secret);
    if (typeof payload !== "object" || payload.role !== "admin") throw new Error("payload inválido");
    next();
  } catch {
    res.status(401).json({ error: "Sessão inválida ou expirada — faça login novamente" });
  }
}

// Limitador simples em memória — suficiente para um painel admin de baixo
// tráfego; não sobrevive a restart nem escala entre instâncias (não é o caso aqui).
const attemptBuckets = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(bucketKey: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = attemptBuckets.get(bucketKey);
  if (!entry || now > entry.resetAt) {
    attemptBuckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

export function checkLoginRateLimit(ip: string): boolean {
  return checkRateLimit(`admin-login:${ip}`, LOGIN_RATE_LIMIT, LOGIN_RATE_WINDOW_MS);
}

// Mais generoso que o login de admin, mas ainda evita spam de e-mail.
export function checkLoginLinkRateLimit(ip: string): boolean {
  return checkRateLimit(`login-link:${ip}`, 5, LOGIN_RATE_WINDOW_MS);
}
