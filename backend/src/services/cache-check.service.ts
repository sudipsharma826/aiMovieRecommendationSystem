import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenRouter } from "@langchain/openrouter";
import { prisma } from "../lib/prisma";
import { z } from "zod";

const SimilarityDecisionSchema = z.object({
  match: z.boolean().describe("Return true only if this is highly similar to an existing query intent, genre, mood and expected result shape"),
  confidence: z.number().min(0).max(1).describe("How confident you are this request matches a known preference pattern"),
  reasoning: z.string().describe("Why it matches or does not match existing preference history")
});

function getChatModel() {
  return new ChatOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
    model: "deepseek/deepseek-chat-v3",
    maxTokens: 2000,
    temperature: 0,
  });
}

const structuredModel = getChatModel().withStructuredOutput(SimilarityDecisionSchema);

const promptTemplate = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a strict similarity classifier for movie recommendation cache hits.`,
  ],
  [
    "human",
    `Current request:
User prompt: {userPrompt}
Genre: {genre}
Mood: {mood}
Count: {count}

Existing cached queries:
{existingQueries}

Decide whether the current request is similar enough that returning the EXACT same cached recommendation would satisfy the user. Do not match on weak or vague similarity.`,
  ],
]);

export async function findMatchingCachedQuery(input: {
  userPrompt: string;
  genre: string;
  mood: string;
  count: number;
}) {
  const rows = await prisma.recommendationQuery.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
  });

  if (!rows.length) return { match: false as const, cachedResult: null };

  const existing = rows
    .map((r) => `- ${r.genre} | ${r.mood} | count=${r.count} | prompt=${r.userPrompt}`)
    .join("\n");

  const chain = promptTemplate.pipe(structuredModel);
  const decision = (await chain.invoke({
    userPrompt: input.userPrompt,
    genre: input.genre,
    mood: input.mood,
    count: input.count,
    existingQueries: existing,
  })) as z.infer<typeof SimilarityDecisionSchema>;

  if (!decision.match || decision.confidence < 0.85) {
    return { match: false as const, cachedResult: null };
  }

  const best = rows[0];
  return {
    match: true as const,
    cachedResult: JSON.parse(best.resultJson) as {
      movies: Array<{
        title: string;
        year: number;
        genre: string[];
        cast: string[];
        reason: string;
        rating: number;
      }>;
    },
  };
}
