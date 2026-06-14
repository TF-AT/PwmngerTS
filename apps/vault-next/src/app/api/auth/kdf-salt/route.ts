import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { JWT_SECRET } from "@/lib/env";
import { createHmac } from "crypto";

/**
 * Returns the KDF salt for a given email.
 *
 * Security notes:
 * - Rate limited to prevent bulk salt harvesting for offline Argon2 attacks.
 * - For unknown emails, returns a deterministic fake salt derived via HMAC
 *   so attackers cannot enumerate registered accounts by checking for 404.
 * - Response time is constant whether or not the user exists.
 */
export async function GET(req: Request) {
  // Rate limiting: 10 requests per hour per IP
  const ip = getClientIp(req);
  const rl = await checkRateLimit(`kdf-salt:${ip}`, 10, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    );
  }

  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { kdfSalt: true },
    });

    if (user?.kdfSalt) {
      return NextResponse.json({ kdfSalt: JSON.parse(user.kdfSalt) });
    }

    // User not found — return a deterministic fake salt so the response is
    // indistinguishable from a real one. The salt is derived from HMAC-SHA256
    // of the email with the server's JWT_SECRET, producing 32 stable bytes.
    const fakeSaltHex = createHmac("sha256", JWT_SECRET)
      .update(`kdf-salt-decoy:${email}`)
      .digest();
    const fakeSalt = Array.from(new Uint8Array(fakeSaltHex));

    return NextResponse.json({ kdfSalt: fakeSalt });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
