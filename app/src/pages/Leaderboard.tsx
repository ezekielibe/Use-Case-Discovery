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
  Title2,
} from "@fluentui/react-components";
import { api, errorMessage } from "../api/client";
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

  return (
    <div className="stack">
      <Title2>Leaderboard</Title2>
      <Text className="muted">
        Final score = 85% facilitator score (value, feasibility, data, effort, risk) + 15% attendee votes. Refreshes
        automatically.
      </Text>
      {error && (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}
      {!entries && !error && <Spinner label="Loading..." />}
      {entries && (
        <div className="panel">
          <Table aria-label="Leaderboard">
            <TableHeader>
              <TableRow>
                <TableHeaderCell style={{ width: 60 }}>#</TableHeaderCell>
                <TableHeaderCell>Idea</TableHeaderCell>
                <TableHeaderCell>Department</TableHeaderCell>
                <TableHeaderCell style={{ width: 80 }}>Votes</TableHeaderCell>
                <TableHeaderCell style={{ width: 160 }}>Facilitator score</TableHeaderCell>
                <TableHeaderCell style={{ width: 140 }}>Final score</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{e.rank}</TableCell>
                  <TableCell>{e.title}</TableCell>
                  <TableCell>{e.department}</TableCell>
                  <TableCell>{e.votes}</TableCell>
                  <TableCell>
                    {formatScore(e.facilitatorScore)}
                    {e.scoreCount > 0 && <Text size={200} className="muted"> ({e.scoreCount})</Text>}
                  </TableCell>
                  <TableCell>
                    <Text weight="semibold">{formatScore(e.finalScore)}</Text>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {entries.length === 0 && <Text>No ideas yet.</Text>}
        </div>
      )}
    </div>
  );
}
