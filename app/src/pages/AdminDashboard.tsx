import { useCallback, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Badge,
  Button,
  Field,
  MessageBar,
  MessageBarBody,
  Slider,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  Textarea,
  Title2,
  Title3,
} from "@fluentui/react-components";
import { ArrowDownloadRegular, ArrowSyncRegular, EyeOffRegular, EyeRegular, SignOutRegular } from "@fluentui/react-icons";
import { adminSession, api, ApiError, errorMessage } from "../api/client";
import { formatScore, previewScore } from "../scoring";
import type { AdminIdea, AppConfig, Ratings } from "../types";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [ideas, setIdeas] = useState<AdminIdea[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) {
        adminSession.clear();
        navigate("/admin/login");
      } else setError(errorMessage(err));
    },
    [navigate],
  );

  const load = useCallback(() => {
    setError("");
    return Promise.all([api.config(), api.adminIdeas()])
      .then(([c, i]) => {
        setConfig(c);
        setIdeas(i);
      })
      .catch(handleError);
  }, [handleError]);

  useEffect(() => {
    if (adminSession.token) load();
  }, [load]);

  if (!adminSession.token) return <Navigate to="/admin/login" replace />;

  async function toggleStatus(idea: AdminIdea) {
    try {
      await api.setStatus(idea.id, idea.status === "visible" ? "hidden" : "visible");
      await load();
    } catch (err) {
      handleError(err);
    }
  }

  async function exportCsv() {
    try {
      const blob = await api.exportCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `use-case-ideas-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      handleError(err);
    }
  }

  function signOut() {
    adminSession.clear();
    navigate("/");
  }

  const selected = ideas?.find((i) => i.id === selectedId) ?? null;

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <Title2>Facilitator dashboard</Title2>
        <div className="row">
          <Text className="muted">Signed in as {adminSession.facilitator}</Text>
          <Button icon={<ArrowSyncRegular />} onClick={load}>
            Refresh
          </Button>
          <Button icon={<ArrowDownloadRegular />} onClick={exportCsv}>
            Export CSV
          </Button>
          <Button icon={<SignOutRegular />} appearance="subtle" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </div>

      {error && (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}
      {(!ideas || !config) && !error && <Spinner label="Loading..." />}

      {ideas && config && (
        <div className="admin-layout">
          <div className="panel">
            <Table aria-label="Ideas" size="small">
              <TableHeader>
                <TableRow>
                  <TableHeaderCell style={{ width: 50 }}>#</TableHeaderCell>
                  <TableHeaderCell>Idea</TableHeaderCell>
                  <TableHeaderCell style={{ width: 70 }}>Votes</TableHeaderCell>
                  <TableHeaderCell style={{ width: 110 }}>Facilitator</TableHeaderCell>
                  <TableHeaderCell style={{ width: 90 }}>Final</TableHeaderCell>
                  <TableHeaderCell style={{ width: 60 }} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {ideas.map((idea) => (
                  <TableRow
                    key={idea.id}
                    className={`clickable-row ${idea.id === selectedId ? "selected-row" : ""}`}
                    onClick={() => setSelectedId(idea.id)}
                  >
                    <TableCell>{idea.rank ?? "—"}</TableCell>
                    <TableCell>
                      <Text weight="semibold">{idea.title}</Text>
                      <br />
                      <Text size={200} className="muted">
                        {idea.department}
                      </Text>
                      {idea.status === "hidden" && (
                        <Badge color="danger" appearance="tint" style={{ marginLeft: 8 }}>
                          Hidden
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{idea.votes}</TableCell>
                    <TableCell>
                      {formatScore(idea.facilitatorScore)}
                      {idea.scores.length > 0 && <Text size={200} className="muted"> ({idea.scores.length})</Text>}
                    </TableCell>
                    <TableCell>
                      <Text weight="semibold">{idea.finalScore?.toFixed(1) ?? "—"}</Text>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        appearance="subtle"
                        aria-label={idea.status === "visible" ? "Hide idea" : "Show idea"}
                        title={idea.status === "visible" ? "Hide idea" : "Show idea"}
                        icon={idea.status === "visible" ? <EyeOffRegular /> : <EyeRegular />}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStatus(idea);
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {ideas.length === 0 && <Text>No ideas submitted yet.</Text>}
          </div>

          <div className="panel">
            {selected ? (
              <ScorePanel key={selected.id} idea={selected} config={config} onSaved={load} onError={handleError} />
            ) : (
              <Text>Select an idea to view details and score it.</Text>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface ScorePanelProps {
  idea: AdminIdea;
  config: AppConfig;
  onSaved: () => Promise<void>;
  onError: (err: unknown) => void;
}

function ScorePanel({ idea, config, onSaved, onError }: ScorePanelProps) {
  const me = adminSession.facilitator.toLowerCase();
  const mine = idea.scores.find((s) => s.facilitator.toLowerCase() === me);
  const [ratings, setRatings] = useState<Ratings>(
    () => mine?.ratings ?? Object.fromEntries(config.criteria.map((c) => [c.key, 3])),
  );
  const [comment, setComment] = useState(mine?.comment ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await api.saveScore(idea.id, ratings, comment);
      await onSaved();
      setSaved(true);
    } catch (err) {
      onError(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stack">
      <Title3>{idea.title}</Title3>
      <Text size={200} className="muted">
        {idea.department} · {idea.submittedBy || "Anonymous"}
        {idea.email && ` · ${idea.email}`} · {idea.frequency} · {idea.usersAffected} users
      </Text>
      <Text weight="semibold">Problem</Text>
      <Text className="prewrap">{idea.problem}</Text>
      <Text weight="semibold">Desired outcome</Text>
      <Text className="prewrap">{idea.desiredOutcome}</Text>
      {idea.currentProcess && (
        <>
          <Text weight="semibold">Current process</Text>
          <Text className="prewrap">{idea.currentProcess}</Text>
        </>
      )}
      {idea.dataSources && (
        <>
          <Text weight="semibold">Data / systems</Text>
          <Text className="prewrap">{idea.dataSources}</Text>
        </>
      )}

      <Title3>Your score</Title3>
      {config.criteria.map((c) => (
        <Field
          key={c.key}
          label={`${c.label} (${Math.round(c.weight * 100)}%): ${ratings[c.key]}`}
          hint={c.description}
        >
          <Slider
            min={1}
            max={5}
            step={1}
            value={ratings[c.key]}
            onChange={(_, d) => setRatings((r) => ({ ...r, [c.key]: d.value }))}
          />
        </Field>
      ))}
      <Field label="Comment (optional)">
        <Textarea value={comment} onChange={(_, d) => setComment(d.value)} maxLength={500} resize="vertical" />
      </Field>
      <div className="row">
        <span className="big-score">{previewScore(config.criteria, ratings).toFixed(1)}</span>
        <Text className="muted">/ 100 weighted score</Text>
      </div>
      <div className="row">
        <Button appearance="primary" onClick={save} disabled={saving}>
          {saving ? "Saving..." : mine ? "Update score" : "Save score"}
        </Button>
        {saved && <Text>Saved.</Text>}
      </div>

      {idea.scores.length > 0 && (
        <>
          <Title3>All facilitator scores</Title3>
          {idea.scores.map((s) => (
            <div key={s.facilitator}>
              <Text weight="semibold">
                {s.facilitator}: {s.weightedScore.toFixed(1)}
              </Text>
              {s.comment && (
                <Text as="p" className="prewrap muted" style={{ margin: "4px 0 0" }}>
                  {s.comment}
                </Text>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
