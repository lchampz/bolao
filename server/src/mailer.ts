import { Resend } from "resend";
import nodemailer from "nodemailer";

const { RESEND_API_KEY, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE, EMAIL_FROM } = process.env;

const APP_URL = process.env.APP_URL ?? "http://localhost:5173";
const appOrigin = APP_URL.startsWith("http") ? APP_URL : `https://${APP_URL}`;
// "bolao.local" não é um domínio real — nunca passaria a verificação de
// domínio do Resend. Sem EMAIL_FROM configurado, cai no sender de teste do
// Resend (funciona sem verificar domínio, mas só é indicado para teste —
// ver docs/DEPLOY.md). SMTP genérico não tem essa restrição.
// "||" (não "??") de propósito — docker-compose resolve env var vazia como
// string vazia, não undefined, e isso também deve cair no padrão.
const from = EMAIL_FROM || (RESEND_API_KEY ? "Bolão Copa AMM <onboarding@resend.dev>" : "Bolão Copa AMM <no-reply@bolao.local>");

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

const smtpTransporter = SMTP_HOST
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT ?? 587),
      secure: SMTP_SECURE === "true",
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    })
  : null;

export function inviteUrl(token: string): string {
  return `${appOrigin}/#/convite/${token}`;
}

export function loginUrl(token: string): string {
  return `${appOrigin}/#/entrar/${token}`;
}

/**
 * Ordem de preferência: Resend (API própria, `RESEND_API_KEY`) → SMTP
 * genérico (`SMTP_HOST`, qualquer provedor: Brevo, Mailtrap, o próprio Resend
 * via SMTP, etc.) → console (dev/local, sem credenciais). Ver docs/DEPLOY.md.
 */
async function sendEmail(to: string, subject: string, text: string, html: string): Promise<void> {
  if (resend) {
    const { error } = await resend.emails.send({ from, to, subject, text, html });
    if (error) throw new Error(`Resend falhou: ${error.message}`);
    return;
  }

  if (smtpTransporter) {
    await smtpTransporter.sendMail({ from, to, subject, text, html });
    return;
  }

  console.log(`[mailer] Nenhum provedor configurado — envio simulado para ${to}:\n${text}`);
}

export async function sendInviteEmail(email: string, token: string): Promise<void> {
  const url = inviteUrl(token);
  await sendEmail(
    email,
    "Você foi convidado para o Bolão Copa AMM Points 2026 🏆",
    `Você foi convidado para participar do Bolão Copa AMM Points 2026!\n\nClique no link abaixo para se cadastrar:\n${url}\n\nBoa sorte!`,
    `
    <div style="font-family: sans-serif; max-width: 480px;">
      <h2>🏆 Você foi convidado!</h2>
      <p>Você foi convidado para participar do <strong>Bolão Copa AMM Points 2026</strong>.</p>
      <p><a href="${url}" style="display:inline-block;background:#23a646;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Aceitar convite e se cadastrar</a></p>
      <p style="color:#666;font-size:12px;">Se o botão não funcionar, copie e cole este link no navegador:<br>${url}</p>
    </div>
  `,
  );
}

/** Link de "recuperar sessão" — válido por 15 min, ver server/src/auth.ts. */
export async function sendLoginLinkEmail(email: string, token: string): Promise<void> {
  const url = loginUrl(token);
  await sendEmail(
    email,
    "Seu link de acesso ao Bolão Copa AMM Points 2026 🏆",
    `Clique no link abaixo para entrar no bolão (válido por 15 minutos):\n${url}`,
    `
    <div style="font-family: sans-serif; max-width: 480px;">
      <h2>🏆 Entrar no Bolão</h2>
      <p>Clique no botão abaixo para entrar (link válido por 15 minutos):</p>
      <p><a href="${url}" style="display:inline-block;background:#23a646;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Entrar no bolão</a></p>
      <p style="color:#666;font-size:12px;">Se o botão não funcionar, copie e cole este link no navegador:<br>${url}</p>
    </div>
  `,
  );
}
