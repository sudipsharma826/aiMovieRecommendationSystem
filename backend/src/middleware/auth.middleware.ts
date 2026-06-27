import { Request, Response, NextFunction } from "express";
import { verifyAuthToken } from "../services/auth.service";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.auth_token as string | undefined;

  if (!token || !verifyAuthToken(token)) {
    return res.status(401).json({
      error: "Please sign in to continue. Your session may have expired or you need to verify your email to access recommendations.",
      code: "AUTH_REQUIRED",
    });
  }

  next();
}