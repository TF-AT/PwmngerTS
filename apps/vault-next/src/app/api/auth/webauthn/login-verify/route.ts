import { NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import * as jwt from "jsonwebtoken";
import crypto from "crypto";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { RP_ID, ORIGIN, JWT_SECRET } from "@/lib/env";
import logger from "@/lib/logger";

export async function POST(req: Request) {
  // Rate limiting: 10 login verification attempts per 5 minutes per IP
  const ip = getClientIp(req);
  const rl = await checkRateLimit(`webauthn-login-verify:${ip}`, 10, 5 * 60 * 1000);
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
    const body = await req.json();
    const cookieStore = await cookies();
    const expectedChallenge = cookieStore.get("webauthn_login_challenge")?.value;
    const userId = cookieStore.get("webauthn_login_user_id")?.value;

    if (!expectedChallenge || !userId) {
      return NextResponse.json({ error: "Authentication challenge not found" }, { status: 400 });
    }

    const authenticator = await prisma.authenticator.findFirst({
      where: { 
        credentialID: body.id,
        userId: userId
      }
    });

    if (!authenticator) {
      // Return 401 directly if authenticator not found
      logger.warn({ userId }, "WebAuthn login failed: authenticator not found");
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }

    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: authenticator.credentialID,
        publicKey: Buffer.from(authenticator.credentialPublicKey, "base64"),
        counter: Number(authenticator.counter),
      },
      requireUserVerification: true,
    });

    const { verified, authenticationInfo } = verification;

    if (verified) {
      await prisma.authenticator.update({
        where: { id: authenticator.id },
        data: { counter: BigInt(authenticationInfo.newCounter) }
      });

      // Issue JWT directly on successful WebAuthn login with aud/iss claims
      const accessToken = jwt.sign(
        { userId, iss: "pwmngerts", aud: "pwmngerts-api" },
        JWT_SECRET,
        { expiresIn: "15m" }
      );

      const refreshTokenString = crypto.randomBytes(40).toString("hex");
      await prisma.refreshToken.create({
        data: {
          token: refreshTokenString,
          userId: userId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      // Check if client is the browser extension
      const isExtension = req.headers.get("x-client-type") === "extension";
      
      const response = NextResponse.json(
        isExtension ? { verified: true, accessToken } : { verified: true }
      );
      
      response.cookies.delete("webauthn_login_challenge");
      response.cookies.delete("webauthn_login_user_id");

      response.cookies.set("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60,
      });

      response.cookies.set("refreshToken", refreshTokenString, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60,
      });

      logger.info({ userId }, "WebAuthn login successful");
      return response;
    } else {
      logger.warn({ userId }, "WebAuthn login failed: signature verification failed");
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }
  } catch (err: any) {
    logger.error(err, "WebAuthn login verification error");
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 400 });
  }
}
