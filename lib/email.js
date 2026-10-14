import { query } from "@/lib/db";

/** Envia e-mails transacionais sem dependência adicional (API HTTP do Resend). */
export async function enviarEmail({ to, subject, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Configure RESEND_API_KEY e EMAIL_FROM para enviar e-mails.");
    }
    console.info(`[ChamaTech e-mail local] ${subject} para ${to}\n${text}`);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });

  if (!response.ok) {
    throw new Error(`O provedor de e-mail retornou HTTP ${response.status}.`);
  }
}

/** E-mail de evento: respeita a preferência do usuário e nunca bloqueia a ação principal. */
export async function enviarEmailEvento({ userId, subject, text, href }) {
  try {
    const { rows } = await query(
      `select email, "emailVerified" as email_verified, email_notifications
         from "user" where id = $1`,
      [userId]
    );
    const recipient = rows[0];
    if (!recipient?.email || !recipient.email_verified || recipient.email_notifications === false) return;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000";
    const link = href ? new URL(href, baseUrl).toString() : null;
    await enviarEmail({ to: recipient.email, subject, text: link ? `${text}\n\nAcesse: ${link}` : text });
  } catch (error) {
    console.error("Falha ao enviar e-mail transacional:", error);
  }
}
