import { useEffect, useState } from "react";
import {
  MessageBar,
  MessageBarBody,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
} from "@fluentui/react-components";
import { TrophyRegular } from "@fluentui/react-icons";
import { api, errorMessage } from "../api/client";
import { PlatformBadge } from "../components/Qualification";
import { formatScore } from "../scoring";
import type { LeaderboardEntry } from "../types";

const REFRESH_MS = 15_000;

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = () =>
      api
        .leaderboard()
        .then((data) => {
          if (!active) return;
          setEntries(data);
          setError("");
        })
        .catch((err) => active && setError(errorMessage(err)));
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const podium = entries?.slice(0, 3) ?? [];

  return (
    <div className="stack">
      <div className="page-header">
        <h1>Leaderboard</h1>
        <Text className="muted">
          Final score = 85% facilitator score (value, feasibility, data, effort, risk) + 15% attendee votes. Updates
          automatically.
        </Text>
      </div>

      {error && (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}
      {!entries && !error && <Spinner label="Loading..." />}
      {entries && entries.length === 0 && (
        <div className="empty-state">
          <Text size={500} weight="semibold">
            No ideas yet
          </Text>
        </div>
      )}

      {podium.length > 0 && (
        <div className="podium">
          {podium.map((e) => (
            <div key={e.id} className={`podium-card podium-${e.rank}`}>
              <div className="podium-rank">
                <TrophyRegular /> #{e.rank}
              </div>
              <Text size={500} weight="semibold">
                {e.title}
              </Text>
              <Text className="muted">{e.department}</Text>
              <PlatformBadge qualification={e.qualification} />
              <div className="podium-score">
                {e.finalScore !== null ? e.finalScore.toFixed(1) : `${e.votes} votes`}
                <span>{e.finalScore !== null ? "final score" : "not yet scored"}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {entries && entries.length > 0 && (
        <div className="panel table-wrap">
          <Table aria-label="Leaderboard">
            <TableHeader>
              <TableRow>
                <TableHeaderCell style={{ width: 56 }}>#</TableHeaderCell>
                <TableHeaderCell>Idea</TableHeaderCell>
                <TableHeaderCell style={{ width: 190 }}>Platform</TableHeaderCell>
                <TableHeaderCell style={{ width: 80 }}>Votes</TableHeaderCell>
                <TableHeaderCell style={{ width: 150 }}>Facilitator score</TableHeaderCell>
                <TableHeaderCell style={{ width: 120 }}>Final score</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <span className="rank-pill">{e.rank}</span>
                  </TableCell>
                  <TableCell>
                    <Text weight="semibold">{e.title}</Text>
                    <br />
                    <Text size={200} className="muted">
                      {e.department}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <PlatformBadge qualification={e.qualification} />
                  </TableCell>
                  <TableCell>{e.votes}</TableCell>
                  <TableCell>
                    {formatScore(e.facilitatorScore)}
                    {e.scoreCount > 0 && <Text size={200} className="muted"> ({e.scoreCount})</Text>}
                  </TableCell>
                  <TableCell>
                    <Text weight="semibold">{e.finalScore?.toFixed(1) ?? "—"}</Text>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
