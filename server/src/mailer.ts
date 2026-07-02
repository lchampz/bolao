import { BrevoClient } from "@getbrevo/brevo";
import nodemailer from "nodemailer";

const { BREVO_API_KEY, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE, EMAIL_FROM } = process.env;

// O `fromService`/`property: host` do Render devolve só o slug do serviço
// (ex. "bolao-web-d8bw"), sem o domínio ".onrender.com" — sem isso os links
// de convite/login apontam pra um host que não existe.
const rawAppUrl = process.env.APP_URL || "http://localhost:5173";
const appOrigin = rawAppUrl.startsWith("http")
  ? rawAppUrl
  : `https://${rawAppUrl.includes(".") ? rawAppUrl : `${rawAppUrl}.onrender.com`}`;

// "||" (não "??") de propósito — docker-compose resolve env var vazia como
// string vazia, não undefined, e isso também deve cair no padrão.
const rawFrom = EMAIL_FROM || "Bolão Copa AMM <no-reply@bolao.local>";

/** "Nome <email>" -> {name, email} — Brevo pede os dois campos separados. */
function parseFrom(raw: string): { name: string; email: string } {
  const match = raw.match(/^(.*)<(.+)>$/);
  if (match) return { name: match[1].trim() || "Bolão Copa AMM", email: match[2].trim() };
  return { name: "Bolão Copa AMM", email: raw.trim() };
}
const from = parseFrom(rawFrom);

const brevo = BREVO_API_KEY ? new BrevoClient({ apiKey: BREVO_API_KEY }) : null;

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
 * Ordem de preferência: Brevo (API própria, `BREVO_API_KEY`) → SMTP genérico
 * (`SMTP_HOST`, qualquer provedor: o próprio Brevo via SMTP, Mailtrap, etc.)
 * → console (dev/local, sem credenciais). Ver docs/DEPLOY.md.
 *
 * Brevo exige um remetente verificado (aba "Senders & IPs" — pode ser um
 * e-mail pessoal confirmado por clique, não precisa de domínio inteiro).
 * Configure EMAIL_FROM com esse endereço; sem isso o envio falha com erro
 * "sender not valid" — ver docs/DEPLOY.md.
 */
async function sendEmail(to: string, subject: string, text: string, html: string): Promise<void> {
  if (brevo) {
    await brevo.transactionalEmails.sendTransacEmail({
      sender: from,
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html,
    });
    return;
  }

  if (smtpTransporter) {
    await smtpTransporter.sendMail({ from: `${from.name} <${from.email}>`, to, subject, text, html });
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
