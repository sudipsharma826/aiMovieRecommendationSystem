import { RecommendationsResponse } from "@/types/movie";

const api_url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchMovies(input: {
  userPrompt: string;
  genre: string;
  mood: string;
  count: number;
}): Promise<RecommendationsResponse> {
  const response = await fetch(`${api_url}/api/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? "Failed to fetch recommendations");
  }

  return response.json();
}
