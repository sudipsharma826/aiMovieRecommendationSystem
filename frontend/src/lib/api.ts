import { RecommendationsResponse } from "@/types/movie";

export class ApiError extends Error {
  code?: string;
  status: number;
  retryAfterSeconds?: number;

  constructor(message: string, status: number, code?: string, retryAfterSeconds?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export async function fetchMovies(input: {
  userPrompt: string;
  genre: string;
  mood: string;
  count: number;
}): Promise<RecommendationsResponse> {
  const response = await fetch(`/api/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      data.error ?? "We couldn't fetch movie recommendations right now. Please try again.",
      response.status,
      data.code,
      data.retryAfterSeconds,
    );
  }

  return data;
}
