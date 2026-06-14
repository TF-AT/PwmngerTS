import { cookies } from "next/headers";
import * as jwt from "jsonwebtoken";
import { JWT_SECRET } from "@/lib/env";

export async function getSession(req?: Request) {
  const cookieStore = await cookies();
  let token = cookieStore.get("accessToken")?.value;

  // Fallback to Authorization header (for browser extension Bearer token usage)
  if (!token && req) {
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: "pwmngerts",
      audience: "pwmngerts-api",
    }) as { userId: string };
    return { userId: decoded.userId };
  } catch (err) {
    // Token is invalid, expired, or has wrong iss/aud — treat as unauthenticated
    return null;
  }
}

export async function getAuthUser(req: Request) {
  const session = await getSession(req);
  return session ? session.userId : null;
}
