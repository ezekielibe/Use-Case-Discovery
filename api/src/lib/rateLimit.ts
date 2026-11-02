import { HttpRequest } from "@azure/functions";
import { hashIdentity } from "./auth";
import { HttpError, clientIp } from "./http";
import { isStatus, table } from "./storage";

async function consume(bucket: string, identity: string, limit: number, windowMs: number): Promise<boolean> {
  const client = await table("RateLimits");
  const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
  const partitionKey = bucket;
  const rowKey = `${identity}_${windowStart}`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const entity = await client.getEntity<{ count: number }>(partitionKey, rowKey);
      if (entity.count >= limit) return false;
      await client.updateEntity({ partitionKey, rowKey, count: entity.count + 1 }, "Replace", { etag: entity.etag });
      return true;
    } catch (err) {
      if (isStatus(err, 404)) {
        try {
          await client.createEntity({ partitionKey, rowKey, count: 1 });
          return true;
        } catch (createErr) {
          if (isStatus(createErr, 409)) continue;
          throw createErr;
        }
      }
      if (isStatus(err, 412)) continue;
      throw err;
    }
  }
  return false;
}

// Per-IP limits are generous because workshop attendees often share one public IP (venue Wi-Fi).
export async function enforceRateLimit(
  req: HttpRequest,
  action: string,
  opts: { perIp: number; perClient?: number; windowMs: number; clientId?: string },
): Promise<void> {
  const checks = [consume(`${action}-ip`, hashIdentity(clientIp(req)), opts.perIp, opts.windowMs)];
  if (opts.perClient && opts.clientId) {
    checks.push(consume(`${action}-client`, hashIdentity(opts.clientId), opts.perClient, opts.windowMs));
  }
  const results = await Promise.all(checks);
  if (results.some((ok) => !ok)) throw new HttpError(429, "Too many requests. Please wait a moment and try again.");
}
