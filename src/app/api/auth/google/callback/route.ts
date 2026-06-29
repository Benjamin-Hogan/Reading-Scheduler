import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  signUserSession,
  userSessionCookieOptions,
  USER_SESSION_COOKIE,
} from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state") ?? "/settings";
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`${state}?google_error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(new URL("/settings?google_error=no_code", request.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ??
    `${request.nextUrl.origin}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL("/settings?google_error=not_configured", request.url)
    );
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(
      new URL("/settings?google_error=token_exchange_failed", request.url)
    );
  }

  const tokens = (await tokenRes.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userInfoRes.ok) {
    return NextResponse.redirect(
      new URL("/settings?google_error=userinfo_failed", request.url)
    );
  }

  const userInfo = (await userInfoRes.json()) as {
    sub: string;
    email?: string;
  };

  if (!userInfo.sub || !userInfo.email) {
    return NextResponse.redirect(
      new URL("/settings?google_error=missing_profile", request.url)
    );
  }

  const cookieStore = await cookies();
  cookieStore.set("google_access_token", tokens.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: tokens.expires_in,
    path: "/",
  });

  if (tokens.refresh_token) {
    cookieStore.set("google_refresh_token", tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  const sessionToken = signUserSession({
    userId: userInfo.sub,
    email: userInfo.email,
    issuedAt: Date.now(),
  });
  cookieStore.set(USER_SESSION_COOKIE, sessionToken, userSessionCookieOptions());

  return NextResponse.redirect(new URL(`${state}?google_connected=1`, request.url));
}
