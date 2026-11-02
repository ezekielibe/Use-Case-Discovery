import type { Criterion, Ratings } from "./types";

// Preview only; the API is the source of truth for stored scores.
export function previewScore(criteria: Criterion[], ratings: Ratings): number {
  const total = criteria.reduce((sum, c) => {
    const normalized = ((ratings[c.key] ?? 3) - 1) / 4;
    return sum + c.weight * (c.invert ? 1 - normalized : normalized) * 100;
  }, 0);
  return Math.round(total * 10) / 10;
}

export const formatScore = (score: number | null) => (score === null ? "Not yet scored" : score.toFixed(1));
