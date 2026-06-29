import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import {
  getRedirectUri,
  getJavaScriptOrigin,
  shouldUseSecureCookies,
  usesFixedRedirectUri,
} from "@/lib/google/oauth";

function makeRequest(url: string): NextRequest {
  return new NextRequest(url);
}

describe("google oauth helpers", () => {
  it("builds redirect URI from request origin", () => {
    const request = makeRequest("https://twenty-ears-pay.loca.lt/settings");
    expect(getRedirectUri(request)).toBe(
      "https://twenty-ears-pay.loca.lt/api/auth/google/callback"
    );
    expect(getJavaScriptOrigin(request)).toBe("https://twenty-ears-pay.loca.lt");
  });

  it("uses secure cookies on HTTPS", () => {
    expect(shouldUseSecureCookies(makeRequest("https://example.com"))).toBe(true);
    expect(shouldUseSecureCookies(makeRequest("http://localhost:3000"))).toBe(false);
  });

  it("reports fixed redirect URI when env is set", () => {
    const original = process.env.GOOGLE_REDIRECT_URI;
    process.env.GOOGLE_REDIRECT_URI = "http://localhost:3000/api/auth/google/callback";
    expect(usesFixedRedirectUri()).toBe(true);
    if (original === undefined) {
      delete process.env.GOOGLE_REDIRECT_URI;
    } else {
      process.env.GOOGLE_REDIRECT_URI = original;
    }
  });
});
