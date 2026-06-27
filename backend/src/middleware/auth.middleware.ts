import { Request, Response, NextFunction } from "express";
import { verifyAuthToken } from "../services/auth.service";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.auth_token as string | undefined;

  if (!token || !verifyAuthToken(token)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}