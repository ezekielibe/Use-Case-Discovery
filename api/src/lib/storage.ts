import { RestError, TableClient, odata } from "@azure/data-tables";
import { requireEnv, workshopId } from "./http";
import { CRITERIA, type Ratings } from "./scoring";

export type TableName = "Ideas" | "Votes" | "Scores" | "RateLimits";

const clients = new Map<TableName, Promise<TableClient>>();

export const isStatus = (err: unknown, status: number) => err instanceof RestError && err.statusCode === status;

export function table(name: TableName): Promise<TableClient> {
  let client = clients.get(name);
  if (!client) {
    client = (async () => {
      const conn = requireEnv("STORAGE_CONNECTION_STRING");
      const insecure = /UseDevelopmentStorage=true|DefaultEndpointsProtocol=http;/i.test(conn);
      const c = TableClient.fromConnectionString(conn, name, { allowInsecureConnection: insecure });
      try {
        await c.createTable();
      } catch (err) {
        if (!isStatus(err, 409)) throw err;
      }
      return c;
    })();
    client.catch(() => clients.delete(name));
    clients.set(name, client);
  }
  return client;
}

export async function listPartition<T extends object>(name: TableName): Promise<T[]> {
  const client = await table(name);
  const items: T[] = [];
  const filter = odata`PartitionKey eq ${workshopId()}`;
  for await (const entity of client.listEntities<T>({ queryOptions: { filter } })) items.push(entity as T);
  return items;
}

export interface IdeaEntity {
  partitionKey: string;
  rowKey: string;
  title: string;
  problem: string;
  desiredOutcome: string;
  currentProcess: string;
  frequency: string;
  usersAffected: string;
  dataSources: string;
  department: string;
  name: string;
  email: string;
  status: "visible" | "hidden";
  createdAt: string;
}

export type ScoreEntity = {
  partitionKey: string;
  rowKey: string;
  ideaId: string;
  facilitator: string;
  comment: string;
  updatedAt: string;
} & Ratings;

interface VoteEntity {
  ideaId: string;
}

export async function getIdea(id: string): Promise<IdeaEntity | null> {
  const client = await table("Ideas");
  try {
    return (await client.getEntity<IdeaEntity>(workshopId(), id)) as IdeaEntity;
  } catch (err) {
    if (isStatus(err, 404)) return null;
    throw err;
  }
}

export const listIdeas = () => listPartition<IdeaEntity>("Ideas");
export const listScores = () => listPartition<ScoreEntity>("Scores");

export async function voteCounts(): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  for (const v of await listPartition<VoteEntity>("Votes")) counts.set(v.ideaId, (counts.get(v.ideaId) ?? 0) + 1);
  return counts;
}

export function toRatings(score: ScoreEntity): Ratings {
  return Object.fromEntries(CRITERIA.map((c) => [c.key, score[c.key]])) as Ratings;
}

export function toPublicIdea(idea: IdeaEntity, votes: number) {
  return {
    id: idea.rowKey,
    title: idea.title,
    problem: idea.problem,
    desiredOutcome: idea.desiredOutcome,
    currentProcess: idea.currentProcess,
    frequency: idea.frequency,
    usersAffected: idea.usersAffected,
    dataSources: idea.dataSources,
    department: idea.department,
    submittedBy: idea.name,
    createdAt: idea.createdAt,
    votes,
  };
}
