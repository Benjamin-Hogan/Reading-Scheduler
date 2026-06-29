import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ signedIn: false });
  }
  return NextResponse.json({
    signedIn: true,
    email: session.email,
    userId: session.userId,
  });
}

export async function DELETE() {
  const response = NextResponse.json({ signedIn: false });
  response.cookies.set("user_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
