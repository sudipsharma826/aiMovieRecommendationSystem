export type Movie = {
  title: string;
  year: number;
  genre: string[];
  cast: string[];
  reason: string;
  rating: number;
};

export type RecommendationsResponse = {
  movies: Movie[];
};
