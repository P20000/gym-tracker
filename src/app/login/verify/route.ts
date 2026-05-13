import { verifyToken } from "../actions";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/login?error=MissingVerificationToken", request.url)
    );
  }

  const result = await verifyToken(token);

  if (!result.success) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(result.error || "VerificationFailed")}`,
        request.url
      )
    );
  }

  const redirectUrl = new URL(
    result.onboardingRequired ? "/onboarding" : "/",
    request.url
  );
  return NextResponse.redirect(redirectUrl);
}
