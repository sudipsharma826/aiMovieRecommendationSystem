import { Request, Response } from "express";
import { findMatchingCachedQuery } from "../services/cache-check.service";
import { runRecommendationTool, checkRateLimit } from "../services/recommendation-tool.service";
import { prisma } from "../lib/prisma";

export async function recommendedMovies(req: Request, res: Response) {
  try {
    const {
      userPrompt = "Suggest movies for a rainy night",
      genre = "thriller",
      mood = "relaxed",
      count = 2,
      email,
    } = req.body;

    const rateUserKey = email || req.ip || "anonymous";

    const rate = checkRateLimit(rateUserKey);
    if (!rate.allowed) {
      return res.status(429).json({
        error: "Too many requests",
        retryAfterSeconds: rate.retryAfterSeconds,
      });
    }

    let verified = false;
    if (email && typeof email === "string" && email.trim()) {
      const user = await prisma.user.findUnique({ where: { email } });
      verified = Boolean(user && user.isVerified);
    }

    const cache = await findMatchingCachedQuery({
      userPrompt,
      genre,
      mood,
      count: Number(count),
    });

    if (cache.match && cache.cachedResult) {
      return res.json({ ...cache.cachedResult, cached: true });
    }

    const result = await runRecommendationTool({
      userPrompt,
      genre,
      mood,
      count: Number(count),
    });

    if (!verified && email && typeof email === "string" && email.trim()) {
      return res.json({ ...result, cached: false, requiresVerification: true });
    }

    return res.json({ ...result, cached: false, requiresVerification: false });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something goes wrong" });
  }
}
