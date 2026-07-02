import nodemailer from "nodemailer";

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE, EMAIL_FROM } = process.env;

const APP_URL = process.env.APP_URL ?? "http://localhost:5173";
const appOrigin = APP_URL.startsWith("http") ? APP_URL : `https://${APP_URL}`;

const transporter = SMTP_HOST
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
 * Sem SMTP_HOST configurado, apenas loga o e-mail no console — permite testar
 * os fluxos de convite/login em dev/local sem precisar de credenciais SMTP
 * reais. Configure SMTP_HOST/PORT/USER/PASS (qualquer provedor: Brevo, Resend,
 * Mailtrap, etc.) para envio real. Ver docs/DEPLOY.md.
 */
async function sendEmail(to: string, subject: string, text: string, html: string): Promise<void> {
  if (!transporter) {
    console.log(`[mailer] SMTP não configurado — envio simulado para ${to}:\n${text}`);
    return;
  }
  await transporter.sendMail({ from: EMAIL_FROM ?? "Bolão Copa AMM <no-reply@bolao.local>", to, subject, text, html });
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
