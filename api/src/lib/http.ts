import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function json(status: number, body: unknown): HttpResponseInit {
  return { status, jsonBody: body, headers: { "Cache-Control": "no-store" } };
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required setting: ${name}`);
  return value;
}

export const workshopId = () => process.env.WORKSHOP_ID || "default";

export function clientIp(req: HttpRequest): string {
  const raw = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-client-ip") || "unknown";
  return /^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(raw) ? raw.split(":")[0] : raw;
}

export function clientId(req: HttpRequest): string {
  const id = req.headers.get("x-client-id") ?? "";
  if (!UUID_RE.test(id)) throw new HttpError(400, "Missing or invalid client id");
  return id.toLowerCase();
}

export async function readJsonBody(req: HttpRequest, maxBytes = 16_384): Promise<Record<string, unknown>> {
  const text = await req.text();
  if (Buffer.byteLength(text) > maxBytes) throw new HttpError(413, "Request too large");
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new HttpError(400, "Invalid request body");
  return parsed as Record<string, unknown>;
}

type Handler = (req: HttpRequest, ctx: InvocationContext) => Promise<HttpResponseInit>;

export function withErrors(fn: Handler): Handler {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof HttpError) return json(err.status, { error: err.message, fields: err.fields });
      ctx.error(err);
      return json(500, { error: "Something went wrong. Please try again." });
    }
  };
}
