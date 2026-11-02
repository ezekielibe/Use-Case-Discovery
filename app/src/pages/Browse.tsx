import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Input,
  MessageBar,
  MessageBarBody,
  Select,
  Spinner,
  Text,
  Title2,
} from "@fluentui/react-components";
import { SearchRegular, ThumbLikeFilled, ThumbLikeRegular } from "@fluentui/react-icons";
import { api, ApiError, errorMessage, votedStore } from "../api/client";
import type { PublicIdea } from "../types";

export default function Browse() {
  const [ideas, setIdeas] = useState<PublicIdea[] | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("");
  const [voted, setVoted] = useState(() => votedStore.get());
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    api.ideas().then(setIdeas).catch((err) => setError(errorMessage(err)));
  }, []);

  const departments = useMemo(() => [...new Set((ideas ?? []).map((i) => i.department))].sort(), [ideas]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (ideas ?? []).filter(
      (i) =>
        (!department || i.department === department) &&
        (!q || [i.title, i.problem, i.desiredOutcome, i.dataSources].some((t) => t.toLowerCase().includes(q))),
    );
  }, [ideas, query, department]);

  function markVoted(id: string) {
    votedStore.add(id);
    setVoted(votedStore.get());
  }

  async function vote(id: string) {
    setBusy(id);
    setError("");
    try {
      await api.vote(id);
      setIdeas((list) => list?.map((i) => (i.id === id ? { ...i, votes: i.votes + 1 } : i)) ?? null);
      markVoted(id);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) markVoted(id);
      else setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="stack">
      <Title2>Browse & vote</Title2>
      <div className="row">
        <Input
          contentBefore={<SearchRegular />}
          placeholder="Search ideas"
          value={query}
          onChange={(_, d) => setQuery(d.value)}
          style={{ minWidth: 280 }}
        />
        <Select value={department} onChange={(_, d) => setDepartment(d.value)}>
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </Select>
      </div>

      {error && (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}
      {!ideas && !error && <Spinner label="Loading ideas..." />}
      {ideas && filtered.length === 0 && <Text>No ideas yet. Be the first to share one!</Text>}

      <div className="cards">
        {filtered.map((idea) => {
          const hasVoted = voted.has(idea.id);
          return (
            <Card key={idea.id}>
              <CardHeader
                header={<Text weight="semibold" size={500}>{idea.title}</Text>}
                description={
                  <Text size={200} className="muted">
                    {idea.submittedBy || "Anonymous"} · {new Date(idea.createdAt).toLocaleDateString()}
                  </Text>
                }
              />
              <div className="row">
                <Badge appearance="tint">{idea.department}</Badge>
                <Badge appearance="outline">{idea.frequency}</Badge>
                <Badge appearance="outline">{idea.usersAffected} users</Badge>
              </div>
              <Text weight="semibold">Problem</Text>
              <Text className="prewrap">{idea.problem}</Text>
              <Text weight="semibold">Desired outcome</Text>
              <Text className="prewrap">{idea.desiredOutcome}</Text>
              {idea.currentProcess && (
                <>
                  <Text weight="semibold">Today</Text>
                  <Text className="prewrap">{idea.currentProcess}</Text>
                </>
              )}
              {idea.dataSources && (
                <Text size={200} className="muted prewrap">
                  Data / systems: {idea.dataSources}
                </Text>
              )}
              <div className="row">
                <Button
                  appearance={hasVoted ? "primary" : "secondary"}
                  icon={hasVoted ? <ThumbLikeFilled /> : <ThumbLikeRegular />}
                  disabled={hasVoted || busy === idea.id}
                  onClick={() => vote(idea.id)}
                >
                  {hasVoted ? "Voted" : "Upvote"} ({idea.votes})
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
