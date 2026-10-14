import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";


const PROTECTED_PREFIXES = [
  "/painel",
  "/painel-tecnico",
  "/painel-admin",
  "/tecnicos",
  "/chamados",
  "/solicitacoes",
  "/meus-chamados",
  "/perfil",
  "/perfil-tecnico",
  "/notificacoes",
  "/usuarios",
  "/tecnicos-pendentes",
  "/disputas",
];

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isProtected) return NextResponse.next();

  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  runtime: "nodejs",
  matcher: [
    "/painel/:path*",
    "/painel-tecnico/:path*",
    "/painel-admin/:path*",
    "/tecnicos/:path*",
    "/chamados/:path*",
    "/solicitacoes/:path*",
    "/meus-chamados/:path*",
    "/perfil/:path*",
    "/perfil-tecnico/:path*",
    "/notificacoes/:path*",
    "/usuarios/:path*",
    "/tecnicos-pendentes/:path*",
    "/disputas/:path*",
  ],
};
