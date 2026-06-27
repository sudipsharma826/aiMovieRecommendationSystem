import { prisma } from "../lib/prisma";
import {
  getRecommendations,
  getStructuredRecommendations,
} from "./langchain.service";

type RateLimitBucket = {
  userKey: string;
  used: number;
  resetAt: Date;
};

type RecommendationInput = {
  userPrompt: string;
  genre: string;
  mood: string;
  count: number;
};

export async function runRecommendationTool(input: RecommendationInput) {
  const result = await getStructuredRecommendations(input);

  const userKey = `${input.genre}|${input.mood}|${input.count}|${input.userPrompt}`;

  const existing = await prisma.recommendationQuery.findFirst({
    where: { genre: input.genre, mood: input.mood, count: input.count, userPrompt: input.userPrompt },
  });

  if (existing) {
    await prisma.recommendationQuery.update({
      where: { id: existing.id },
      data: { resultJson: JSON.stringify(result), source: "llm" },
    });
  } else {
    await prisma.recommendationQuery.create({
      data: {
        userPrompt: input.userPrompt,
        genre: input.genre,
        mood: input.mood,
        count: input.count,
        resultJson: JSON.stringify(result),
        source: "llm",
      },
    });
  }

  return result;
}

const bucket = new Map<string, RateLimitBucket>();

export function checkRateLimit(userKey: string, limit = 2, windowMs = 60_000) {
  const now = new Date();
  const current = bucket.get(userKey);

  if (!current || current.resetAt <= now) {
    bucket.set(userKey, { userKey, used: 1, resetAt: new Date(now.getTime() + windowMs) });
    return { allowed: true as const, remaining: limit - 1 };
  }

  if (current.used >= limit) {
    const retryAfterMs = current.resetAt.getTime() - now.getTime();
    return {
      allowed: false as const,
      remaining: 0,
      retryAfterMs,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  current.used += 1;
  return { allowed: true as const, remaining: limit - current.used };
}
