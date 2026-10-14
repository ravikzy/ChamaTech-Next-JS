import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { enviarEmail } from "@/lib/email";

const production = process.env.NODE_ENV === "production";
export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    // Em produção o envio/validação de e-mail é obrigatório. No ambiente local,
    // permite entrar mesmo sem um provedor de e-mail configurado; ações de
    // chamados continuam verificando emailVerified no servidor.
    requireEmailVerification: production,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await enviarEmail({
        to: user.email,
        subject: "Recupere sua senha do ChamaTech",
        text: `Olá, ${user.name}. Para criar uma nova senha, acesse: ${url}\n\nSe você não pediu a recuperação, ignore esta mensagem.`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await enviarEmail({
        to: user.email,
        subject: "Confirme seu e-mail no ChamaTech",
        text: `Olá, ${user.name}. Para confirmar seu e-mail, acesse: ${url}\n\nSe você não criou uma conta, ignore esta mensagem.`,
      });
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 60,
    storage: "memory",
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
      "/request-password-reset": { window: 60, max: 3 },
      "/send-verification-email": { window: 60, max: 3 },
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "client",
        input: false, 
      },
      phone: {
        type: "string",
        required: false,
        maxLength: 20,
      },
      termsAccepted: {
        type: "boolean",
        fieldName: "terms_accepted",
        required: true,
        input: true,
      },
      termsAcceptedAt: {
        type: "date",
        fieldName: "terms_accepted_at",
        required: false,
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (user.termsAccepted !== true) {
            throw new Error("É necessário aceitar os termos e a política de privacidade.");
          }
          return { data: { ...user, role: "client", termsAcceptedAt: new Date() } };
        },

        after: async (user) => {
          const { query } = await import("@/lib/db");
          if (user.role === "client") {
            await query(
              `insert into clients (user_id) values ($1) on conflict do nothing`,
              [user.id]
            );
          } else if (user.role === "technician") {
            await query(
              `insert into technicians (user_id, is_available, is_verified) values ($1, false, false) on conflict do nothing`,
              [user.id]
            );
          }
        },
      },
    },
  },
  advanced: {
    useSecureCookies: production,
    defaultCookieAttributes: {
      httpOnly: true,
      secure: production,
      sameSite: "lax",
    },
  },
});
