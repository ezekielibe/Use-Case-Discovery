export const CRITERIA = [
  { key: "businessValue", label: "Business Value", weight: 0.3, invert: false, description: "Impact on time, cost, revenue or experience" },
  { key: "feasibility", label: "Feasibility", weight: 0.25, invert: false, description: "How achievable it is with Copilot Studio today" },
  { key: "dataAvailability", label: "Data Availability", weight: 0.2, invert: false, description: "Required data and systems are accessible and connectable" },
  { key: "effort", label: "Effort", weight: 0.15, invert: true, description: "Build effort (1 = low, 5 = high)" },
  { key: "risk", label: "Risk", weight: 0.1, invert: true, description: "Compliance, security or change risk (1 = low, 5 = high)" },
] as const;

export type CriterionKey = (typeof CRITERIA)[number]["key"];
export type Ratings = Record<CriterionKey, number>;

export const FACILITATOR_WEIGHT = 0.85;
export const VOTE_WEIGHT = 0.15;

const round1 = (n: number) => Math.round(n * 10) / 10;

export function criterionScore(rating: number, invert: boolean): number {
  const normalized = (rating - 1) / 4;
  return (invert ? 1 - normalized : normalized) * 100;
}

function rawWeightedScore(ratings: Ratings): number {
  return CRITERIA.reduce((sum, c) => sum + c.weight * criterionScore(ratings[c.key], c.invert), 0);
}

export function weightedScore(ratings: Ratings): number {
  return round1(rawWeightedScore(ratings));
}

export interface Rankable {
  votes: number;
  ratings: Ratings[];
}

export interface RankFields {
  facilitatorScore: number | null;
  voteScore: number;
  finalScore: number | null;
  rank: number;
}

export function rankIdeas<T extends Rankable>(items: T[]): (T & RankFields)[] {
  const maxVotes = Math.max(0, ...items.map((i) => i.votes));
  const scored = items.map((item) => {
    const facilitatorScore = item.ratings.length
      ? round1(item.ratings.reduce((s, r) => s + rawWeightedScore(r), 0) / item.ratings.length)
      : null;
    const voteScore = maxVotes > 0 ? round1((item.votes / maxVotes) * 100) : 0;
    const finalScore =
      facilitatorScore === null ? null : round1(FACILITATOR_WEIGHT * facilitatorScore + VOTE_WEIGHT * voteScore);
    return { ...item, facilitatorScore, voteScore, finalScore, rank: 0 };
  });

  // Scored ideas first (by final score), unscored ideas after (by votes).
  scored.sort((a, b) => {
    if (a.finalScore !== null && b.finalScore !== null) return b.finalScore - a.finalScore || b.votes - a.votes;
    if (a.finalScore !== null) return -1;
    if (b.finalScore !== null) return 1;
    return b.votes - a.votes;
  });
  scored.forEach((s, i) => (s.rank = i + 1));
  return scored;
}
