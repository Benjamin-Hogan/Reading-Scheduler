import type { NextRequest } from "next/server";

export const GOOGLE_OAUTH_CALLBACK_PATH = "/api/auth/google/callback";

export function getRedirectUri(request: NextRequest): string {
  if (process.env.GOOGLE_REDIRECT_URI) {
    return process.env.GOOGLE_REDIRECT_URI;
  }
  return `${request.nextUrl.origin}${GOOGLE_OAUTH_CALLBACK_PATH}`;
}

export function getJavaScriptOrigin(request: NextRequest): string {
  return request.nextUrl.origin;
}

export function usesFixedRedirectUri(): boolean {
  return Boolean(process.env.GOOGLE_REDIRECT_URI);
}

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function isGoogleBooksConfigured(): boolean {
  return Boolean(process.env.GOOGLE_BOOKS_API_KEY);
}

/** Secure cookies are required on HTTPS (tunnels, production). */
export function shouldUseSecureCookies(request: NextRequest): boolean {
  return process.env.NODE_ENV === "production" || request.nextUrl.protocol === "https:";
}

export function getGoogleAuthCookieOptions(request: NextRequest, maxAge: number) {
  return {
    httpOnly: true as const,
    secure: shouldUseSecureCookies(request),
    sameSite: "lax" as const,
    maxAge,
    path: "/",
  };
}
