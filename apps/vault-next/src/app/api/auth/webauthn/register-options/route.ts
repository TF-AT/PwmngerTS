import { NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { RP_ID } from "@/lib/env";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const rpName = "PwmngerTS";

export async function POST(req: Request) {
  // Rate limiting: 10 requests per hour per IP
  const ip = getClientIp(req);
  const rl = await checkRateLimit(`webauthn-register-options:${ip}`, 10, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    );
  }

  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { authenticators: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const options = await generateRegistrationOptions({
      rpName,
      rpID: RP_ID,
      userID: Buffer.from(user.id),
      userName: user.email,
      userDisplayName: user.email,
      attestationType: "none",
      excludeCredentials: user.authenticators.map(auth => ({
        id: auth.credentialID,
        type: "public-key" as const,
      })),
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
        authenticatorAttachment: "cross-platform",
      },
    });

    const response = NextResponse.json(options);
    
    // Store challenge in a cookie for verification
    response.cookies.set("webauthn_registration_challenge", options.challenge, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 300, // 5 minutes
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
