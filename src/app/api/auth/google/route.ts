import { NextRequest, NextResponse } from "next/server";
import { getRedirectUri, isGoogleOAuthConfigured } from "@/lib/google/oauth";

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = getRedirectUri(request);

  if (!clientId || !isGoogleOAuthConfigured()) {
    return NextResponse.json(
      { error: "Google OAuth is not configured" },
      { status: 500 }
    );
  }

  const returnTo = request.nextUrl.searchParams.get("returnTo") ?? "/settings";

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state: returnTo,
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
}
