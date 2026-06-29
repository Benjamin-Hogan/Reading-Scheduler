import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const hasRefresh = !!cookieStore.get("google_refresh_token")?.value;
  const hasAccess = !!cookieStore.get("google_access_token")?.value;

  return NextResponse.json({ connected: hasRefresh || hasAccess });
}
