import type { AdminIdea, AppConfig, IdeaInput, LeaderboardEntry, PublicIdea, Ratings } from "../types";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

const CLIENT_KEY = "ucd.clientId";
const VOTED_KEY = "ucd.voted";
const TOKEN_KEY = "ucd.adminToken";
const FACILITATOR_KEY = "ucd.facilitator";

function clientId(): string {
  let id = localStorage.getItem(CLIENT_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(CLIENT_KEY, id);
  }
  return id;
}

export const votedStore = {
  get(): Set<string> {
    try {
      return new Set(JSON.parse(localStorage.getItem(VOTED_KEY) ?? "[]"));
    } catch {
      return new Set();
    }
  },
  add(id: string) {
    const set = votedStore.get();
    set.add(id);
    localStorage.setItem(VOTED_KEY, JSON.stringify([...set]));
  },
};

export const adminSession = {
  get token() {
    return sessionStorage.getItem(TOKEN_KEY);
  },
  get facilitator() {
    return sessionStorage.getItem(FACILITATOR_KEY) ?? "";
  },
  set(token: string, facilitator: string) {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(FACILITATOR_KEY, facilitator);
  },
  clear() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(FACILITATOR_KEY);
  },
};

async function call(path: string, init: RequestInit = {}, admin = false): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("x-client-id", clientId());
  if (init.body) headers.set("Content-Type", "application/json");
  if (admin && adminSession.token) headers.set("x-admin-token", adminSession.token);

  const res = await fetch(`/api/${path}`, { ...init, headers });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let fields: Record<string, string> | undefined;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
      fields = body?.fields;
    } catch {
      // Non-JSON error body; keep the default message.
    }
    throw new ApiError(res.status, message, fields);
  }
  return res;
}

async function getJson<T>(path: string, init?: RequestInit, admin = false): Promise<T> {
  return (await call(path, init, admin)).json() as Promise<T>;
}

const id = (value: string) => encodeURIComponent(value);

export const api = {
  config: () => getJson<AppConfig>("config"),
  ideas: () => getJson<PublicIdea[]>("ideas"),
  submitIdea: (input: IdeaInput) => getJson<{ id: string }>("ideas", { method: "POST", body: JSON.stringify(input) }),
  vote: async (ideaId: string) => {
    await call(`ideas/${id(ideaId)}/vote`, { method: "POST" });
  },
  leaderboard: () => getJson<LeaderboardEntry[]>("leaderboard"),
  login: (passcode: string, facilitator: string) =>
    getJson<{ token: string; facilitator: string; expiresAt: number }>("manage/login", {
      method: "POST",
      body: JSON.stringify({ passcode, facilitator }),
    }),
  adminIdeas: () => getJson<AdminIdea[]>("manage/ideas", {}, true),
  saveScore: async (ideaId: string, ratings: Ratings, comment: string) => {
    await call(`manage/ideas/${id(ideaId)}/score`, { method: "PUT", body: JSON.stringify({ ratings, comment }) }, true);
  },
  setStatus: async (ideaId: string, status: "visible" | "hidden") => {
    await call(`manage/ideas/${id(ideaId)}`, { method: "PATCH", body: JSON.stringify({ status }) }, true);
  },
  exportCsv: async () => (await call("manage/export", {}, true)).blob(),
};

export const errorMessage = (err: unknown) =>
  err instanceof ApiError ? err.message : "Network error. Please check your connection and try again.";
