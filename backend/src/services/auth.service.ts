import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Resend } from "resend";
import { prisma } from "../lib/prisma";

const resend = new Resend(process.env.RESEND_API_KEY);

const OTP_TTL_MINUTES = 10;
const AUTH_TOKEN_TTL_DAYS = 7;
const AUTH_TOKEN_TTL_MS = AUTH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;
const JWT_SECRET = process.env.JWT_SECRET || "change-me-secret";

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateToken() {
  return jwt.sign({ type: "auth" }, JWT_SECRET, {
    expiresIn: `${AUTH_TOKEN_TTL_DAYS}d`,
  });
}

export async function requestOtp(email: string) {
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  const user = await prisma.user.upsert({
    where: { email },
    update: { otp, otpExpiresAt: expiresAt },
    create: { email, otp, otpExpiresAt: expiresAt, isVerified: false },
  });

  await resend.emails.send({
    from: "AI Movie <aimovie@sudipsharma.com.np>",
    to: [email],
    subject: "Your verification code",
    html: `<p>Your verification code is <b>${otp}</b>. It expires in ${OTP_TTL_MINUTES} minutes.</p>`,
  });

  return { ok: true, alreadyVerified: user.isVerified } as const;
}

export async function verifyOtp(email: string, otp: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.otp || !user.otpExpiresAt) {
    throw new Error("Invalid verification attempt");
  }

  if (user.otpExpiresAt < new Date()) {
    throw new Error("OTP expired");
  }

  if (user.otp !== otp) {
    throw new Error("Wrong OTP");
  }

  const token = generateToken();
  const tokenExpiresAt = new Date(Date.now() + AUTH_TOKEN_TTL_MS);

  await prisma.user.update({
    where: { email },
    data: {
      isVerified: true,
      otp: null,
      otpExpiresAt: null,
      authToken: token,
      tokenExpiresAt,
    },
  });

  return { ok: true, token, expiresAt: tokenExpiresAt } as const;
}

export async function issueTokenIfVerified(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.isVerified) {
    throw new Error("Email not verified");
  }

  const token = generateToken();
  const tokenExpiresAt = new Date(Date.now() + AUTH_TOKEN_TTL_MS);

  await prisma.user.update({
    where: { email },
    data: { authToken: token, tokenExpiresAt },
  });

  return { ok: true, token, expiresAt: tokenExpiresAt } as const;
}

export function verifyAuthToken(token: string) {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { type: string };
    return payload.type === "auth";
  } catch {
    return false;
  }
}
