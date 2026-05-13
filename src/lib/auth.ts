import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "gym-tracker-local-secret-key-1234567890"
);

export interface JWTPayload {
  userId: string;
  email: string;
}

/**
 * Sign a user session JWT with a 30-day expiration.
 */
export async function signJWT(payload: JWTPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

/**
 * Verify a session JWT and return the decoded payload.
 * Returns null if verification fails.
 */
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Get the currently authenticated user from cookies.
 * Compatible with Next.js 15 asynchronous cookie requirements.
 */
export async function getAuthUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("gym_auth_token")?.value;
  if (!token) return null;
  return await verifyJWT(token);
}

/**
 * Log out the active user by deleting the auth token cookie.
 */
export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete("gym_auth_token");
}
