import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Gera automaticamente: /api/auth/sign-in, /api/auth/sign-up,
// /api/auth/sign-out, /api/auth/session, rotas do plugin admin, etc.
export const { GET, POST } = toNextJsHandler(auth);
""