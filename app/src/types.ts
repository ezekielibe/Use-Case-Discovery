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
}

export interface IdeaInput {
  name: string;
  email: string;
  department: string;
  title: string;
  problem: string;
  desiredOutcome: string;
  currentProcess: string;
  frequency: string;
  usersAffected: string;
  dataSources: string;
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
  createdAt: string;
  votes: number;
}

export interface LeaderboardEntry {
  id: string;
  title: string;
  department: string;
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
  email: string;
  status: "visible" | "hidden";
  scores: FacilitatorScore[];
  facilitatorScore: number | null;
  voteScore: number;
  finalScore: number | null;
  rank: number | null;
}
