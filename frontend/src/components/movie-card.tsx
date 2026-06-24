import { Film, Star, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Movie } from "@/types/movie";

const ACCENT_BARS = [
  "from-violet-500 to-indigo-500",
  "from-sky-500 to-cyan-500",
  "from-amber-500 to-orange-500",
  "from-emerald-500 to-teal-500",
  "from-rose-500 to-pink-500",
];

const GENRE_COLORS = [
  "bg-violet-100 text-violet-700 border-violet-200",
  "bg-sky-100 text-sky-700 border-sky-200",
  "bg-amber-100 text-amber-800 border-amber-200",
  "bg-emerald-100 text-emerald-700 border-emerald-200",
  "bg-rose-100 text-rose-700 border-rose-200",
];

type MovieCardProps = {
  movie: Movie;
  index: number;
};

export function MovieCard({ movie, index }: MovieCardProps) {
  const accent = ACCENT_BARS[index % ACCENT_BARS.length];

  return (
    <Card className="overflow-hidden border-white/80 bg-white/90 shadow-lg shadow-indigo-100/60 backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-200/50">
      <div className={`h-1.5 bg-gradient-to-r ${accent}`} />
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg font-semibold text-slate-900">
              {movie.title}
            </CardTitle>
            <CardDescription className="mt-1 flex items-center gap-1.5 text-slate-500">
              <Film className="size-3.5" />
              {movie.year}
            </CardDescription>
          </div>
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-sm font-semibold text-amber-700 ring-1 ring-amber-200">
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
            {movie.rating.toFixed(1)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {movie.genre.map((g, i) => (
            <Badge
              key={g}
              variant="outline"
              className={GENRE_COLORS[i % GENRE_COLORS.length]}
            >
              {g}
            </Badge>
          ))}
        </div>
        <div className="flex items-start gap-2 text-sm text-slate-600">
          <Users className="mt-0.5 size-4 shrink-0 text-violet-500" />
          <p>{movie.cast.join(" · ")}</p>
        </div>
        <div className={`rounded-lg bg-gradient-to-br ${accent} p-px`}>
          <div className="rounded-[7px] bg-violet-50/80 px-3 py-2.5">
            <p className="text-xs font-medium uppercase tracking-wide text-violet-600">
              Why this matches you
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-700">
              {movie.reason}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
