export interface Criterion {
  key: string;
  label: string;
  weight: number;
  invert: boolean;
  description: string;
}

export interface AppConfig {
  criteria: Criterion[];
  facilitatorWeight: number;
  voteWeight: number;
  frequencies: string[];
  usersAffected: string[];
  audiences: string[];
  capabilities: { key: string; label: string }[];
}

export type Platform = "agent-builder" | "copilot-studio";

export interface Qualification {
  platform: Platform;
  platformLabel: string;
  confidence: "High" | "Medium" | "Low";
  complexity: "Low" | "Medium" | "High";
  reasons: string[];
}

export interface IdeaInput {
  name: string;
  department: string;
  title: string;
  problem: string;
  desiredOutcome: string;
  currentProcess: string;
  frequency: string;
  usersAffected: string;
  dataSources: string;
  audience: string;
  capabilities: string[];
  website: string;
}

export interface PublicIdea {
  id: string;
  title: string;
  problem: string;
  desiredOutcome: string;
  currentProcess: string;
  frequency: string;
  usersAffected: string;
  dataSources: string;
  department: string;
  submittedBy: string;
  audience: string;
  capabilities: string[];
  createdAt: string;
  votes: number;
  qualification: Qualification;
}

export interface LeaderboardEntry {
  id: string;
  title: string;
  department: string;
  qualification: Qualification;
  votes: number;
  facilitatorScore: number | null;
  voteScore: number;
  finalScore: number | null;
  scoreCount: number;
  rank: number;
}

export type Ratings = Record<string, number>;

export interface FacilitatorScore {
  facilitator: string;
  ratings: Ratings;
  comment: string;
  weightedScore: number;
  updatedAt: string;
}

export interface AdminIdea extends PublicIdea {
  status: "visible" | "hidden";
  scores: FacilitatorScore[];
  facilitatorScore: number | null;
  voteScore: number;
  finalScore: number | null;
  rank: number | null;
}
