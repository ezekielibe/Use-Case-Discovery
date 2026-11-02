import { describe, expect, it } from "vitest";
import { criterionScore, rankIdeas, weightedScore, type Ratings } from "./scoring";

const best: Ratings = { businessValue: 5, feasibility: 5, dataAvailability: 5, effort: 1, risk: 1 };
const worst: Ratings = { businessValue: 1, feasibility: 1, dataAvailability: 1, effort: 5, risk: 5 };
const middle: Ratings = { businessValue: 3, feasibility: 3, dataAvailability: 3, effort: 3, risk: 3 };

describe("criterionScore", () => {
  it("maps 1-5 to 0-100", () => {
    expect(criterionScore(1, false)).toBe(0);
    expect(criterionScore(5, false)).toBe(100);
  });
  it("inverts effort/risk style criteria", () => {
    expect(criterionScore(1, true)).toBe(100);
    expect(criterionScore(5, true)).toBe(0);
  });
});

describe("weightedScore", () => {
  it("scores best, worst and middle ratings", () => {
    expect(weightedScore(best)).toBe(100);
    expect(weightedScore(worst)).toBe(0);
    expect(weightedScore(middle)).toBe(50);
  });
});

describe("rankIdeas", () => {
  it("averages facilitators, normalises votes and puts unscored ideas last", () => {
    const ranked = rankIdeas([
      { id: "unscored", votes: 10, ratings: [] },
      { id: "a", votes: 5, ratings: [best, worst] },
      { id: "b", votes: 10, ratings: [best] },
    ]);
    expect(ranked.map((r) => r.id)).toEqual(["b", "a", "unscored"]);

    const b = ranked[0];
    expect(b.facilitatorScore).toBe(100);
    expect(b.voteScore).toBe(100);
    expect(b.finalScore).toBe(100);

    const a = ranked[1];
    expect(a.facilitatorScore).toBe(50);
    expect(a.voteScore).toBe(50);
    expect(a.finalScore).toBe(50);

    const unscored = ranked[2];
    expect(unscored.facilitatorScore).toBeNull();
    expect(unscored.finalScore).toBeNull();
    expect(unscored.rank).toBe(3);
  });

  it("handles zero votes", () => {
    const [only] = rankIdeas([{ votes: 0, ratings: [middle] }]);
    expect(only.voteScore).toBe(0);
    expect(only.finalScore).toBe(42.5);
  });
});
