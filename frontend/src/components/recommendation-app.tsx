"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Clapperboard, Loader2, Mail, Wand2 } from "lucide-react";
import Image from "next/image";

import { MovieCard } from "@/components/movie-card";
import { MovieCardSkeleton } from "@/components/movie-card-skeleton";
import { AdSenseBanner } from "@/components/adsense-banner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Movie } from "@/types/movie";
import { fetchMovies } from "@/lib/api";

const GENRES = [
  "thriller",
  "comedy",
  "sci-fi",
  "drama",
  "action",
  "horror",
  "romance",
] as const;

const MOODS = [
  "relaxed",
  "excited",
  "curious",
  "happy",
  "thoughtful",
  "cozy",
] as const;

const COUNTS = ["3", "5", "10"] as const;

export function RecommendationApp() {
  const [userPrompt, setUserPrompt] = useState(
    "Suggest movies for a rainy night",
  );
  const [genre, setGenre] = useState<string>("thriller");
  const [mood, setMood] = useState<string>("relaxed");
  const [count, setCount] = useState<string>("3");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [backendStatus, setBackendStatus] = useState<
    "loading" | "ok" | "error"
  >("loading");
  const [backendMessage, setBackendMessage] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function checkBackend() {
      try {
        const res = await fetch("/api/health");
        const data = (await res.json()) as {
          status: string;
          message?: string;
        };
        if (cancelled) return;
        if (data.status === "ok") {
          setBackendStatus("ok");
          setBackendMessage("Backend running successfully");
        } else {
          setBackendStatus("error");
          setBackendMessage(
            data.message ?? "Backend health check failed",
          );
        }
      } catch (err) {
        if (cancelled) return;
        setBackendStatus("error");
        setBackendMessage(
          err instanceof Error ? err.message : "Cannot reach backend",
        );
      }
    }

    checkBackend();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userPrompt.trim()) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const data = await fetchMovies({
        userPrompt: userPrompt.trim(),
        genre,
        mood,
        count: Number(count),
      });

      setMovies(data.movies);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-svh bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-100 via-indigo-50 to-sky-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="AI Movie Recommendation logo"
              width={120}
              height={120}
              className="rounded-2xl shadow-lg"
              priority
            />
          </div>
          <h1 className="bg-gradient-to-r from-violet-700 via-indigo-600 to-sky-600 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
            AI Movie Recommendation
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Developed by{" "}
            <a
              href="https://sudipsharma.com.np"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-violet-700 underline underline-offset-2 hover:text-violet-800"
            >
              Sudip Sharma
            </a>
          </p>
          <p className="mt-2 text-sm text-slate-600">
            <a
              href="mailto:sudeepsharma826@gmail.com"
              className="inline-flex items-center gap-1.5 text-violet-700 hover:text-violet-800"
            >
              <Mail className="size-3.5" />
              sudeepsharma826@gmail.com
            </a>
          </p>
          <div className="mt-3 flex justify-center">
            <Badge
              variant={
                backendStatus === "ok"
                  ? "default"
                  : backendStatus === "error"
                    ? "destructive"
                    : "secondary"
              }
              className={
                backendStatus === "ok"
                  ? "text-xs bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "text-xs"
              }
            >
              {backendStatus === "loading"
                ? "Checking backend..."
                : backendStatus === "ok"
                  ? "Backend running successfully"
                  : backendMessage || "Backend unreachable"}
            </Badge>
          </div>
        </header>

        <AdSenseBanner slot="TOP_BANNER_SLOT" />


        <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
          <aside className="h-fit rounded-2xl border border-white/80 bg-white/80 p-6 shadow-xl shadow-violet-200/40 backdrop-blur-md">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex items-center gap-2 text-violet-800">
                <Clapperboard className="size-5" />
                <h2 className="font-semibold">Your preferences</h2>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prompt" className="text-slate-700">
                  What are you in the mood for?
                </Label>
                <Textarea
                  id="prompt"
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="Suggest 3 thriller movies for a rainy night..."
                  rows={4}
                  className="resize-none border-violet-200/60 bg-violet-50/30 focus-visible:ring-violet-400/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-slate-700">Genre</Label>
                  <Select value={genre} onValueChange={(v) => v && setGenre(v)}>
                    <SelectTrigger className="w-full border-violet-200/60 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GENRES.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g.charAt(0).toUpperCase() + g.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">Mood</Label>
                  <Select value={mood} onValueChange={(v) => v && setMood(v)}>
                    <SelectTrigger className="w-full border-violet-200/60 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MOODS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m.charAt(0).toUpperCase() + m.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700">How many movies?</Label>
                <Select value={count} onValueChange={(v) => v && setCount(v)}>
                  <SelectTrigger className="w-full border-violet-200/60 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c} movies
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                disabled={loading || !userPrompt.trim()}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-300/50 hover:from-violet-700 hover:to-indigo-700"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Finding movies...
                  </>
                ) : (
                  <>
                    <Wand2 />
                    Get recommendations
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 flex justify-center">
              <AdSenseBanner slot="SIDEBAR_AD_SLOT" format="auto" />
            </div>
          </aside>

          <main>
            {error && (
              <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            {loading && (
              <div className="grid gap-5 sm:grid-cols-2">
                {Array.from({ length: Number(count) }).map((_, i) => (
                  <MovieCardSkeleton key={i} />
                ))}
              </div>
            )}

            {!loading && movies.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2">
                {movies.map((movie, i) => (
                  <MovieCard
                    key={`${movie.title}-${i}`}
                    movie={movie}
                    index={i}
                  />
                ))}
              </div>
            )}

            {!loading && !error && movies.length === 0 && !hasSearched && (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-violet-200/80 bg-white/50 px-6 text-center backdrop-blur-sm">
                <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100">
                  <Clapperboard className="size-8 text-violet-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">
                  Your picks will appear here
                </h3>
                <p className="mt-2 max-w-sm text-sm text-slate-500">
                  Set your genre, mood, and describe what you want — then hit
                  Get recommendations.
                </p>
              </div>
            )}

            {!loading && !error && movies.length === 0 && hasSearched && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-10 text-center text-amber-800">
                No movies returned. Try a different prompt.
              </div>
            )}

          </main>

          <div className="mt-10 flex justify-center">
            <AdSenseBanner slot="BOTTOM_AD_SLOT" />
          </div>
        </div>
      </div>
    </div>
  );
}
