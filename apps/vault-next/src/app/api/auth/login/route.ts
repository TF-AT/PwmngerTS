import { NextResponse } from "next/server";
import * as argon2 from "argon2";
import * as jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { JWT_SECRET } from "@/lib/env";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import logger from "@/lib/logger";
import crypto from "crypto";

export async function POST(req: Request) {
  // Rate limiting: 5 attempts per 15 minutes per IP
  const ip = getClientIp(req);
  const rl = await checkRateLimit(`login:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    );
  }

  try {
    const { email, authHash, twoFactorToken } = await req.json();

    const user = await prisma.user.findUnique({ where: { email } });

    // Always run argon2.verify to prevent timing-based email enumeration.
    // If user is not found we hash the authHash itself — this takes a similar
    // amount of time to verify() and reveals nothing about whether the user exists.
    const hashToVerify = user?.passwordHash;
    let isValid: boolean;

    if (hashToVerify) {
      isValid = await argon2.verify(hashToVerify, authHash);
    } else {
      // Dummy work to maintain constant response time
      await argon2.hash(authHash);
      isValid = false;
    }

    if (!user || !isValid) {
      logger.warn({ email }, "Login failed: invalid credentials");
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Check 2FA if enabled
    if (user.twoFactorSecret) {
      if (!twoFactorToken) {
        return NextResponse.json({ requires2FA: true }, { status: 401 });
      }

      const otplib = await import("otplib");
      const totp = new otplib.TOTP({
        crypto: new otplib.NobleCryptoPlugin(),
        base32: new otplib.ScureBase32Plugin(),
      });
      const { decryptServerSide } = await import("@/lib/serverCrypto");
      const isValid2FA = await totp.verify(twoFactorToken, { secret: decryptServerSide(user.twoFactorSecret) });

      if (!isValid2FA) {
        logger.warn({ userId: user.id }, "Login failed: invalid 2FA token");
        return NextResponse.json({ error: "Invalid 2FA token" }, { status: 401 });
      }
    }

    const accessToken = jwt.sign(
      { userId: user.id, iss: "pwmngerts", aud: "pwmngerts-api" },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    const refreshTokenString = crypto.randomBytes(40).toString("hex");
    await prisma.refreshToken.create({
      data: {
        token: refreshTokenString,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Tokens are ONLY set as httpOnly cookies for web clients — never returned in the JSON body.
    // However, they are returned in the JSON body for the browser extension context.
    const isExtension = req.headers.get("x-client-type") === "extension";
    const response = NextResponse.json(
      isExtension
        ? { success: true, accessToken, refreshToken: refreshTokenString }
        : { success: true }
    );

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

    logger.info({ userId: user.id }, "Login successful");
    return response;
  } catch (err) {
    logger.error(err, "Login error");
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
