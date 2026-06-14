import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as jwt from "jsonwebtoken";
import { JWT_SECRET } from "@/lib/env";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { cookies } from "next/headers";
import logger from "@/lib/logger";
import crypto from "crypto";

export async function POST(req: Request) {
  // Rate limiting: 10 refreshes per 5 minutes per IP
  const ip = getClientIp(req);
  const rl = await checkRateLimit(`refresh:${ip}`, 10, 5 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    );
  }

  const cookieStore = await cookies();
  const refreshTokenString = cookieStore.get("refreshToken")?.value;

  if (!refreshTokenString) {
    return NextResponse.json({ error: "No refresh token" }, { status: 401 });
  }

  try {
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshTokenString },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      // Clear stale cookies if the token is invalid or expired
      const response = NextResponse.json(
        { error: "Invalid or expired refresh token" },
        { status: 401 }
      );
      response.cookies.delete("accessToken");
      response.cookies.delete("refreshToken");
      return response;
    }

    // Token rotation: delete the used token and issue a fresh one.
    // This ensures a stolen refresh token can only be used once.
    await prisma.refreshToken.delete({ where: { id: tokenRecord.id } });

    const newRefreshTokenString = crypto.randomBytes(40).toString("hex");
    await prisma.refreshToken.create({
      data: {
        token: newRefreshTokenString,
        userId: tokenRecord.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const accessToken = jwt.sign(
      { userId: tokenRecord.userId, iss: "pwmngerts", aud: "pwmngerts-api" },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    // Tokens are ONLY set as httpOnly cookies for web clients — never returned in the JSON body.
    // However, they are returned in the JSON body for the browser extension context.
    const isExtension = req.headers.get("x-client-type") === "extension";
    const response = NextResponse.json(
      isExtension
        ? { success: true, accessToken, refreshToken: newRefreshTokenString }
        : { success: true }
    );

    response.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60,
    });

    response.cookies.set("refreshToken", newRefreshTokenString, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    logger.error(error, "Token refresh error");
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
