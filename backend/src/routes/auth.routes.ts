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
      return res.status(400).json({
        error: "We need your email address to send you a verification code. Please enter a valid email.",
        code: "EMAIL_REQUIRED",
      });
    }

    const result = await requestOtp(email.trim());
    return res.json(result);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "We couldn't send the verification code right now. Please try again in a few moments.",
      code: "OTP_SEND_FAILED",
    });
  }
});

authRouter.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body as { email?: string; otp?: string };
    if (!email || !otp) {
      return res.status(400).json({
        error: "Please provide both your email and the 6-digit verification code we sent you.",
        code: "OTP_INPUT_REQUIRED",
      });
    }

    const result = await verifyOtp(email.trim(), String(otp).trim());
    setAuthCookie(res, result.token);
    return res.json({ ok: true, verified: true });
  } catch (error) {
    console.log(error);
    const message = error instanceof Error ? error.message : "";
    if (message === "Wrong OTP" || message === "Invalid verification attempt") {
      return res.status(400).json({
        error: "That verification code doesn't match. Please check the code we sent and try again.",
        code: "OTP_INVALID",
      });
    }
    if (message === "OTP expired") {
      return res.status(400).json({
        error: "Your verification code has expired. Please request a new one.",
        code: "OTP_EXPIRED",
      });
    }
    return res.status(400).json({
      error: "We couldn't verify that code. Please request a new verification code and try again.",
      code: "OTP_VERIFY_FAILED",
    });
  }
});

authRouter.post("/issue-token", async (req, res) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email || !email.trim()) {
      return res.status(400).json({
        error: "We need your email address to issue a new sign-in token.",
        code: "EMAIL_REQUIRED",
      });
    }

    const result = await issueTokenIfVerified(email.trim());
    setAuthCookie(res, result.token);
    return res.json({ ok: true });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      error: "We couldn't sign you in. Your email may not be verified yet. Please request a verification code first.",
      code: "TOKEN_ISSUE_FAILED",
    });
  }
});

authRouter.get("/me", async (req, res) => {
  const token = req.cookies?.auth_token as string | undefined;
  if (!token || !verifyAuthToken(token)) {
    return res.json({ authenticated: false });
  }

  return res.json({ authenticated: true });
});
