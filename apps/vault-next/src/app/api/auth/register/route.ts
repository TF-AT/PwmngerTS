import { NextResponse } from "next/server";
import * as argon2 from "argon2";
import * as jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { JWT_SECRET } from "@/lib/env";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import logger from "@/lib/logger";
import { AuthError } from "@pwmnger/errors";
import crypto from "crypto";

export async function POST(req: Request) {
  // Rate limiting: 3 registrations per hour per IP
  const ip = getClientIp(req);
  const rl = await checkRateLimit(`register:${ip}`, 3, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    );
  }

  try {
    const { email, authHash, kdfSalt } = await req.json();

    const serverHash = await argon2.hash(authHash);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: serverHash,
        kdfSalt: JSON.stringify(kdfSalt),
      },
    });

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

    logger.info({ userId: user.id, email }, "User registered successfully");
    return response;
  } catch (err: any) {
    logger.error(err, "Registration error");
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
