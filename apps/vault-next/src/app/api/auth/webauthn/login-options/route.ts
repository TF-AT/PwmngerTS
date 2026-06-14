import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { RP_ID, JWT_SECRET } from "@/lib/env";
import { createHmac } from "crypto";

export async function POST(req: Request) {
  // Rate limiting: 10 requests per hour per IP
  const ip = getClientIp(req);
  const rl = await checkRateLimit(`webauthn-login-options:${ip}`, 10, 60 * 60 * 1000);
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
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { authenticators: true }
    });

    let userId: string;
    let credentials: { id: string; type: "public-key" }[];

    if (user) {
      userId = user.id;
      credentials = user.authenticators.map(auth => ({
        id: auth.credentialID,
        type: "public-key" as const,
      }));
    } else {
      // User not found — generate deterministic fake credentials/user ID
      userId = createHmac("sha256", JWT_SECRET)
        .update(`webauthn-user:${email}`)
        .digest("hex");
      
      const fakeCredId = createHmac("sha256", JWT_SECRET)
        .update(`webauthn-cred:${email}`)
        .digest("base64");

      credentials = [{
        id: fakeCredId,
        type: "public-key" as const,
      }];
    }

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials: credentials,
      userVerification: "preferred",
    });

    const response = NextResponse.json(options);
    
    response.cookies.set("webauthn_login_challenge", options.challenge, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 300, // 5 minutes
    });
    
    response.cookies.set("webauthn_login_user_id", userId, {
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
