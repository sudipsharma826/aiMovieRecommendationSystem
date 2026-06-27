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

    if (!userPrompt || !userPrompt.trim()) {
      return res.status(400).json({
        error: "Please tell us what kind of movies you're looking for. A short description helps us find the perfect picks!",
        code: "PROMPT_REQUIRED",
      });
    }

    const rateUserKey = email || req.ip || "anonymous";

    const rate = checkRateLimit(rateUserKey);
    if (!rate.allowed) {
      return res.status(429).json({
        error: `You've been making a lot of requests! Please wait about ${rate.retryAfterSeconds} seconds before trying again.`,
        code: "RATE_LIMITED",
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
    const message = error instanceof Error ? error.message : "";
    if (message.includes("timed out") || message.includes("timeout") || message.includes("ETIMEDOUT")) {
      return res.status(504).json({
        error: "The recommendation service is taking longer than expected. Please try again in a moment.",
        code: "SERVICE_TIMEOUT",
      });
    }
    if (message.includes("rate_limit") || message.includes("Rate limit")) {
      return res.status(429).json({
        error: "You've reached the request limit. Please wait a moment before trying again.",
        code: "RATE_LIMITED",
      });
    }
    if (message.includes("401") || message.includes("unauthorized") || message.includes("API key")) {
      return res.status(502).json({
        error: "We're having trouble connecting to our movie database. Our team has been notified.",
        code: "LLM_CONFIG_ERROR",
      });
    }
    res.status(500).json({
      error: "Something unexpected happened while finding your recommendations. Please try again.",
      code: "INTERNAL_ERROR",
    });
  }
}
