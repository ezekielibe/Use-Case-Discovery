import { app } from "@azure/functions";
import { randomUUID } from "node:crypto";
import { HttpError, UUID_RE, clientId, json, readJsonBody, withErrors, workshopId } from "../lib/http";
import { enforceRateLimit } from "../lib/rateLimit";
import { CRITERIA, FACILITATOR_WEIGHT, VOTE_WEIGHT, rankIdeas } from "../lib/scoring";
import { hashIdentity } from "../lib/auth";
import {
  type IdeaEntity,
  getIdea,
  isStatus,
  listIdeas,
  listScores,
  qualifyIdea,
  table,
  toPublicIdea,
  toRatings,
  voteCounts,
} from "../lib/storage";
import { FREQUENCIES, USERS_AFFECTED, validateIdea } from "../lib/validation";
import { AUDIENCES, CAPABILITIES } from "../lib/qualification";

app.http("getConfig", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "config",
  handler: withErrors(async () =>
    json(200, {
      criteria: CRITERIA,
      facilitatorWeight: FACILITATOR_WEIGHT,
      voteWeight: VOTE_WEIGHT,
      frequencies: FREQUENCIES,
      usersAffected: USERS_AFFECTED,
      audiences: AUDIENCES,
      capabilities: CAPABILITIES,
    }),
  ),
});

app.http("listIdeas", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "ideas",
  handler: withErrors(async () => {
    const [ideas, votes] = await Promise.all([listIdeas(), voteCounts()]);
    const result = ideas
      .filter((i) => i.status === "visible")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((i) => toPublicIdea(i, votes.get(i.rowKey) ?? 0));
    return json(200, result);
  }),
});

app.http("submitIdea", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "ideas",
  handler: withErrors(async (req) => {
    const client = clientId(req);
    await enforceRateLimit(req, "submit", { perIp: 100, perClient: 5, windowMs: 10 * 60 * 1000, clientId: client });
    const input = validateIdea(await readJsonBody(req));
    const entity: IdeaEntity = {
      partitionKey: workshopId(),
      rowKey: randomUUID(),
      ...input,
      status: "visible",
      createdAt: new Date().toISOString(),
    };
    await (await table("Ideas")).createEntity(entity);
    return json(201, { id: entity.rowKey, qualification: qualifyIdea(entity) });
  }),
});

app.http("voteIdea", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "ideas/{id}/vote",
  handler: withErrors(async (req) => {
    const id = req.params.id;
    if (!UUID_RE.test(id)) throw new HttpError(400, "Invalid idea id");
    const client = clientId(req);
    await enforceRateLimit(req, "vote", { perIp: 1000, perClient: 60, windowMs: 60 * 60 * 1000, clientId: client });

    const idea = await getIdea(id);
    if (!idea || idea.status !== "visible") throw new HttpError(404, "Idea not found");

    try {
      await (await table("Votes")).createEntity({
        partitionKey: workshopId(),
        rowKey: `${id}_${hashIdentity(client)}`,
        ideaId: id,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      if (isStatus(err, 409)) throw new HttpError(409, "You have already voted for this idea");
      throw err;
    }
    return json(201, { ok: true });
  }),
});

app.http("leaderboard", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "leaderboard",
  handler: withErrors(async () => {
    const [ideas, votes, scores] = await Promise.all([listIdeas(), voteCounts(), listScores()]);
    const ranked = rankIdeas(
      ideas
        .filter((i) => i.status === "visible")
        .map((i) => ({
          id: i.rowKey,
          title: i.title,
          department: i.department,
          qualification: qualifyIdea(i),
          votes: votes.get(i.rowKey) ?? 0,
          ratings: scores.filter((s) => s.ideaId === i.rowKey).map(toRatings),
        })),
    );
    return json(
      200,
      ranked.map(({ ratings, ...rest }) => ({ ...rest, scoreCount: ratings.length })),
    );
  }),
});
