import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import * as otplib from "otplib";

export async function POST(req: Request) {
  const userId = await getAuthUser(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { token, secret } = await req.json();
    
    const totp = new otplib.TOTP({
      crypto: new otplib.NobleCryptoPlugin(),
      base32: new otplib.ScureBase32Plugin()
    });
    
    const isValid = await totp.verify(token, { secret });
    
    if (!isValid) {
      return NextResponse.json({ error: "Invalid 2FA token" }, { status: 400 });
    }

    const { encryptServerSide } = await import("@/lib/serverCrypto");
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: encryptServerSide(secret) },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("2FA Verify Error:", error);
    return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
