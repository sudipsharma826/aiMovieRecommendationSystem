import { Router, Response } from "express";
import { issueTokenIfVerified, requestOtp, verifyOtp, verifyAuthToken } from "../services/auth.service";

export const authRouter = Router();

function setAuthCookie(res: Response, token: string) {
  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  });
}

authRouter.post("/request-otp", async (req, res) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email || !email.trim()) {
      return res.status(400).json({ error: "Email is required" });
    }

    const result = await requestOtp(email.trim());
    return res.json(result);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to send OTP" });
  }
});

authRouter.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body as { email?: string; otp?: string };
    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const result = await verifyOtp(email.trim(), String(otp).trim());
    setAuthCookie(res, result.token);
    return res.json({ ok: true, verified: true });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ error: "Invalid or expired OTP" });
  }
});

authRouter.post("/issue-token", async (req, res) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email || !email.trim()) {
      return res.status(400).json({ error: "Email is required" });
    }

    const result = await issueTokenIfVerified(email.trim());
    setAuthCookie(res, result.token);
    return res.json({ ok: true });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ error: "Email not verified" });
  }
});

authRouter.get("/me", async (req, res) => {
  const token = req.cookies?.auth_token as string | undefined;
  if (!token || !verifyAuthToken(token)) {
    return res.json({ authenticated: false });
  }

  return res.json({ authenticated: true });
});
