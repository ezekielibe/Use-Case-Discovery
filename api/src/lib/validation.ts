import { HttpError } from "./http";
import { CRITERIA, type Ratings } from "./scoring";

export const FREQUENCIES = ["Daily", "Weekly", "Monthly", "Quarterly", "Ad hoc"];
export const USERS_AFFECTED = ["1-10", "11-50", "51-200", "201-1000", "1000+"];

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

export function cleanText(value: unknown): string {
  return typeof value === "string" ? value.replace(CONTROL_CHARS, "").trim() : "";
}

const TEXT_FIELDS = ["name", "email", "department", "title", "problem", "desiredOutcome", "currentProcess", "dataSources"] as const;
type TextField = (typeof TEXT_FIELDS)[number];

const TEXT_RULES: Record<TextField, { max: number; required?: boolean }> = {
  name: { max: 100 },
  email: { max: 200 },
  department: { max: 100, required: true },
  title: { max: 120, required: true },
  problem: { max: 2000, required: true },
  desiredOutcome: { max: 2000, required: true },
  currentProcess: { max: 2000 },
  dataSources: { max: 1000 },
};

export type IdeaInput = Record<TextField, string> & { frequency: string; usersAffected: string };

export function validateIdea(body: Record<string, unknown>): IdeaInput {
  // Honeypot field: hidden from humans, usually filled by bots.
  if (cleanText(body.website)) throw new HttpError(400, "Submission rejected");

  const errors: Record<string, string> = {};
  const values = {} as Record<TextField, string>;
  for (const field of TEXT_FIELDS) {
    const rule = TEXT_RULES[field];
    const value = cleanText(body[field]);
    if (rule.required && !value) errors[field] = "This field is required";
    else if (value.length > rule.max) errors[field] = `Maximum ${rule.max} characters`;
    values[field] = value;
  }
  if (values.email && !EMAIL_RE.test(values.email)) errors.email = "Enter a valid email address";

  const frequency = cleanText(body.frequency);
  if (!FREQUENCIES.includes(frequency)) errors.frequency = "Select how often this happens";
  const usersAffected = cleanText(body.usersAffected);
  if (!USERS_AFFECTED.includes(usersAffected)) errors.usersAffected = "Select how many users are affected";

  if (Object.keys(errors).length) throw new HttpError(400, "Please fix the highlighted fields", errors);
  return { ...values, frequency, usersAffected };
}

export function validateScore(body: Record<string, unknown>): { ratings: Ratings; comment: string } {
  const raw = (body.ratings && typeof body.ratings === "object" ? body.ratings : {}) as Record<string, unknown>;
  const errors: Record<string, string> = {};
  const ratings = {} as Ratings;
  for (const c of CRITERIA) {
    const v = raw[c.key];
    if (typeof v !== "number" || !Number.isInteger(v) || v < 1 || v > 5) errors[c.key] = "Must be a whole number from 1 to 5";
    else ratings[c.key] = v;
  }
  const comment = cleanText(body.comment);
  if (comment.length > 500) errors.comment = "Maximum 500 characters";
  if (Object.keys(errors).length) throw new HttpError(400, "Invalid score", errors);
  return { ratings, comment };
}

export function validateFacilitatorName(value: unknown): string {
  const name = cleanText(value);
  if (!name || name.length > 60) throw new HttpError(400, "Enter your name (max 60 characters)", { facilitator: "Required" });
  return name;
}
