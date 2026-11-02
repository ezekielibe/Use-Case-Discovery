import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Input, MessageBar, MessageBarBody, Select, Spinner, Text } from "@fluentui/react-components";
import { SearchRegular, ThumbLikeFilled, ThumbLikeRegular } from "@fluentui/react-icons";
import { api, ApiError, errorMessage, votedStore } from "../api/client";
import { PlatformBadge } from "../components/Qualification";
import type { PublicIdea } from "../types";

type Sort = "newest" | "votes";

export default function Browse() {
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState<PublicIdea[] | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("");
  const [platform, setPlatform] = useState("");
  const [sort, setSort] = useState<Sort>("newest");
  const [voted, setVoted] = useState(() => votedStore.get());
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    api.ideas().then(setIdeas).catch((err) => setError(errorMessage(err)));
  }, []);

  const departments = useMemo(() => [...new Set((ideas ?? []).map((i) => i.department))].sort(), [ideas]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (ideas ?? []).filter(
      (i) =>
        (!department || i.department === department) &&
        (!platform || i.qualification.platform === platform) &&
        (!q || [i.title, i.problem, i.desiredOutcome, i.dataSources].some((t) => t.toLowerCase().includes(q))),
    );
    return sort === "votes" ? [...list].sort((a, b) => b.votes - a.votes) : list;
  }, [ideas, query, department, platform, sort]);

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
      <div className="page-header">
        <h1>Browse & vote</h1>
        <Text className="muted">Upvote the ideas you'd most like to see built. Hover a platform badge to see why it was suggested.</Text>
      </div>

      <div className="toolbar">
        <Input
          contentBefore={<SearchRegular />}
          placeholder="Search ideas"
          value={query}
          onChange={(_, d) => setQuery(d.value)}
          className="toolbar-search"
        />
        <Select value={department} onChange={(_, d) => setDepartment(d.value)} aria-label="Department">
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </Select>
        <Select value={platform} onChange={(_, d) => setPlatform(d.value)} aria-label="Platform">
          <option value="">All platforms</option>
          <option value="agent-builder">M365 Agent Builder</option>
          <option value="copilot-studio">Copilot Studio</option>
        </Select>
        <Select value={sort} onChange={(_, d) => setSort(d.value as Sort)} aria-label="Sort">
          <option value="newest">Newest first</option>
          <option value="votes">Most votes</option>
        </Select>
      </div>

      {error && (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}
      {!ideas && !error && <Spinner label="Loading ideas..." />}
      {ideas && filtered.length === 0 && (
        <div className="empty-state">
          <Text size={500} weight="semibold">
            {ideas.length ? "No ideas match your filters" : "No ideas yet"}
          </Text>
          <Button appearance="primary" onClick={() => navigate("/submit")}>
            Share the first idea
          </Button>
        </div>
      )}

      <div className="cards">
        {filtered.map((idea) => {
          const hasVoted = voted.has(idea.id);
          return (
            <article key={idea.id} className="idea-card">
              <div className="idea-card-top">
                <PlatformBadge qualification={idea.qualification} />
                <Badge appearance="tint" color="brand">
                  {idea.department}
                </Badge>
              </div>
              <h3>{idea.title}</h3>
              <div>
                <Text weight="semibold" size={200} className="label">
                  Problem
                </Text>
                <Text as="p" className="prewrap clamp">
                  {idea.problem}
                </Text>
              </div>
              <div>
                <Text weight="semibold" size={200} className="label">
                  Desired outcome
                </Text>
                <Text as="p" className="prewrap clamp">
                  {idea.desiredOutcome}
                </Text>
              </div>
              <div className="row">
                <Badge appearance="outline">{idea.frequency}</Badge>
                <Badge appearance="outline">{idea.usersAffected} users</Badge>
                <Badge appearance="outline">{idea.qualification.complexity} complexity</Badge>
              </div>
              {idea.dataSources && (
                <Text size={200} className="muted prewrap">
                  Data / systems: {idea.dataSources}
                </Text>
              )}
              <div className="idea-card-footer">
                <Text size={200} className="muted">
                  {idea.submittedBy || "Anonymous"} · {new Date(idea.createdAt).toLocaleDateString()}
                </Text>
                <Button
                  appearance={hasVoted ? "primary" : "secondary"}
                  icon={hasVoted ? <ThumbLikeFilled /> : <ThumbLikeRegular />}
                  disabled={hasVoted || busy === idea.id}
                  onClick={() => vote(idea.id)}
                >
                  {idea.votes}
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
