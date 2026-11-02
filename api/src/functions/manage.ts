import { app } from "@azure/functions";
import { createHash } from "node:crypto";
import { issueToken, requireAdmin, verifyPasscode } from "../lib/auth";
import { HttpError, UUID_RE, json, readJsonBody, withErrors, workshopId } from "../lib/http";
import { enforceRateLimit } from "../lib/rateLimit";
import { rankIdeas, weightedScore } from "../lib/scoring";
import {
  type IdeaEntity,
  type ScoreEntity,
  getIdea,
  listIdeas,
  listScores,
  table,
  toPublicIdea,
  toRatings,
  voteCounts,
} from "../lib/storage";
import { validateFacilitatorName, validateScore } from "../lib/validation";

app.http("adminLogin", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "manage/login",
  handler: withErrors(async (req) => {
    await enforceRateLimit(req, "login", { perIp: 20, windowMs: 15 * 60 * 1000 });
    const body = await readJsonBody(req, 2048);
    const facilitator = validateFacilitatorName(body.facilitator);
    const passcode = typeof body.passcode === "string" ? body.passcode : "";
    if (!passcode || !verifyPasscode(passcode)) throw new HttpError(401, "Incorrect passcode");
    return json(200, { ...issueToken(facilitator), facilitator });
  }),
});

async function buildAdminIdeas() {
  const [ideas, votes, scores] = await Promise.all([listIdeas(), voteCounts(), listScores()]);
  const toItem = (i: IdeaEntity) => {
    const ideaScores = scores.filter((s) => s.ideaId === i.rowKey);
    return {
      ...toPublicIdea(i, votes.get(i.rowKey) ?? 0),
      email: i.email,
      status: i.status,
      ratings: ideaScores.map(toRatings),
      scores: ideaScores.map((s) => ({
        facilitator: s.facilitator,
        ratings: toRatings(s),
        comment: s.comment,
        weightedScore: weightedScore(toRatings(s)),
        updatedAt: s.updatedAt,
      })),
    };
  };
  const visible = rankIdeas(ideas.filter((i) => i.status === "visible").map(toItem));
  const hidden = rankIdeas(ideas.filter((i) => i.status !== "visible").map(toItem)).map((i) => ({ ...i, rank: null }));
  return [...visible, ...hidden].map(({ ratings, ...rest }) => rest);
}

app.http("adminListIdeas", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "manage/ideas",
  handler: withErrors(async (req) => {
    requireAdmin(req);
    return json(200, await buildAdminIdeas());
  }),
});

app.http("adminScoreIdea", {
  methods: ["PUT"],
  authLevel: "anonymous",
  route: "manage/ideas/{id}/score",
  handler: withErrors(async (req) => {
    const { facilitator } = requireAdmin(req);
    const id = req.params.id;
    if (!UUID_RE.test(id)) throw new HttpError(400, "Invalid idea id");
    if (!(await getIdea(id))) throw new HttpError(404, "Idea not found");

    const { ratings, comment } = validateScore(await readJsonBody(req));
    const facilitatorKey = createHash("sha256").update(facilitator.toLowerCase()).digest("hex").slice(0, 16);
    const entity: ScoreEntity = {
      partitionKey: workshopId(),
      rowKey: `${id}_${facilitatorKey}`,
      ideaId: id,
      facilitator,
      comment,
      updatedAt: new Date().toISOString(),
      ...ratings,
    };
    await (await table("Scores")).upsertEntity(entity, "Replace");
    return json(200, { weightedScore: weightedScore(ratings) });
  }),
});

app.http("adminUpdateIdea", {
  methods: ["PATCH"],
  authLevel: "anonymous",
  route: "manage/ideas/{id}",
  handler: withErrors(async (req) => {
    requireAdmin(req);
    const id = req.params.id;
    if (!UUID_RE.test(id)) throw new HttpError(400, "Invalid idea id");
    const body = await readJsonBody(req, 1024);
    if (body.status !== "visible" && body.status !== "hidden") throw new HttpError(400, "Status must be visible or hidden");
    if (!(await getIdea(id))) throw new HttpError(404, "Idea not found");
    await (await table("Ideas")).updateEntity({ partitionKey: workshopId(), rowKey: id, status: body.status }, "Merge");
    return json(200, { ok: true });
  }),
});

// Prefix risky leading characters to prevent CSV/formula injection in Excel.
function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

app.http("adminExport", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "manage/export",
  handler: withErrors(async (req) => {
    requireAdmin(req);
    const ideas = await buildAdminIdeas();
    const header = [
      "Rank", "Title", "Department", "Submitted By", "Email", "Problem", "Desired Outcome", "Current Process",
      "Frequency", "Users Affected", "Data Sources", "Votes", "Facilitator Score", "Vote Score", "Final Score",
      "Number of Scores", "Facilitator Comments", "Status", "Created At",
    ];
    const rows = ideas.map((i) => [
      i.rank ?? "", i.title, i.department, i.submittedBy, i.email, i.problem, i.desiredOutcome, i.currentProcess,
      i.frequency, i.usersAffected, i.dataSources, i.votes, i.facilitatorScore ?? "", i.voteScore, i.finalScore ?? "",
      i.scores.length, i.scores.filter((s) => s.comment).map((s) => `${s.facilitator}: ${s.comment}`).join(" | "),
      i.status, i.createdAt,
    ]);
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
    return {
      status: 200,
      body: `\uFEFF${csv}`,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="use-case-ideas.csv"',
        "Cache-Control": "no-store",
      },
    };
  }),
});
