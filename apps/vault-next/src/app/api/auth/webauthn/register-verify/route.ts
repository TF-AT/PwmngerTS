import { NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { cookies } from "next/headers";
import { RP_ID, ORIGIN } from "@/lib/env";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import logger from "@/lib/logger";

export async function POST(req: Request) {
  // Rate limiting: 10 attempts per hour per IP
  const ip = getClientIp(req);
  const rl = await checkRateLimit(`webauthn-register-verify:${ip}`, 10, 60 * 60 * 1000);
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

    const body = await req.json();
    const cookieStore = await cookies();
    const expectedChallenge = cookieStore.get("webauthn_registration_challenge")?.value;

    if (!expectedChallenge) {
      return NextResponse.json({ error: "Registration challenge not found" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: true,
    });

    const { verified, registrationInfo } = verification;

    if (verified && registrationInfo) {
      const { credential } = registrationInfo;
      const { publicKey, id: credentialID, counter } = credential;

      await prisma.authenticator.create({
        data: {
          credentialID: Buffer.from(credentialID).toString("base64"),
          credentialPublicKey: Buffer.from(publicKey).toString("base64"),
          counter,
          credentialDeviceType: registrationInfo.credentialDeviceType,
          credentialBackedUp: registrationInfo.credentialBackedUp,
          userId: user.id,
        },
      });

      const response = NextResponse.json({ verified: true });
      response.cookies.delete("webauthn_registration_challenge");
      
      logger.info({ userId: user.id }, "WebAuthn authenticator registered successfully");
      return response;
    } else {
      logger.warn({ userId: user.id }, "WebAuthn registration verification failed");
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }
  } catch (err: any) {
    logger.error(err, "WebAuthn registration verification error");
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 400 });
  }
}
