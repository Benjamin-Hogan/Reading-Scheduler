import { NextRequest, NextResponse } from "next/server";
import {
  getJavaScriptOrigin,
  getRedirectUri,
  isGoogleBooksConfigured,
  isGoogleOAuthConfigured,
  usesFixedRedirectUri,
} from "@/lib/google/oauth";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    oauthConfigured: isGoogleOAuthConfigured(),
    booksApiConfigured: isGoogleBooksConfigured(),
    usesFixedRedirectUri: usesFixedRedirectUri(),
    javascriptOrigin: getJavaScriptOrigin(request),
    redirectUri: getRedirectUri(request),
    setupGuideUrl: "/docs/google-cloud-setup.md",
  });
}
