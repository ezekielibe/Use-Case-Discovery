import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Text } from "@fluentui/react-components";
import {
  ArrowRightRegular,
  CheckmarkCircleRegular,
  LightbulbRegular,
  SparkleRegular,
  ThumbLikeRegular,
  TrophyRegular,
} from "@fluentui/react-icons";
import { api } from "../api/client";
import { PLATFORM_INFO, PlatformIcon } from "../components/Qualification";
import type { Platform, PublicIdea } from "../types";

const steps = [
  { icon: <LightbulbRegular />, title: "Share", text: "Describe a repetitive task or process you'd like an AI agent to handle." },
  { icon: <SparkleRegular />, title: "Get matched", text: "Each idea is automatically qualified for M365 Agent Builder or Copilot Studio." },
  { icon: <ThumbLikeRegular />, title: "Vote", text: "Browse ideas from other attendees and upvote the ones you'd love to see built." },
  { icon: <TrophyRegular />, title: "Prioritise", text: "Facilitators score value, feasibility, data, effort and risk to pick the winners." },
];

const PLATFORMS: Platform[] = ["agent-builder", "copilot-studio"];

export default function Home() {
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState<PublicIdea[] | null>(null);

  useEffect(() => {
    api.ideas().then(setIdeas).catch(() => setIdeas(null));
  }, []);

  const stats = ideas && [
    { label: "Ideas shared", value: ideas.length },
    { label: "Votes cast", value: ideas.reduce((sum, i) => sum + i.votes, 0) },
    { label: "Departments", value: new Set(ideas.map((i) => i.department)).size },
    { label: "Agent Builder fits", value: ideas.filter((i) => i.qualification.platform === "agent-builder").length },
    { label: "Copilot Studio fits", value: ideas.filter((i) => i.qualification.platform === "copilot-studio").length },
  ];

  return (
    <div className="stack-lg">
      <section className="hero">
        <span className="eyebrow">
          <SparkleRegular /> Use Case Discovery Workshop
        </span>
        <h1>Which parts of your work should become an AI agent?</h1>
        <p>
          Share the scenarios where an agent could save you time, improve quality or delight your customers. We'll
          instantly suggest whether your idea fits <strong>M365 Agent Builder</strong> or <strong>Copilot Studio</strong>.
          No sign-in needed.
        </p>
        <div className="row">
          <Button
            appearance="primary"
            size="large"
            className="hero-primary"
            icon={<ArrowRightRegular />}
            iconPosition="after"
            onClick={() => navigate("/submit")}
          >
            Share an idea
          </Button>
          <Button size="large" className="hero-secondary" onClick={() => navigate("/ideas")}>
            Browse & vote
          </Button>
        </div>
      </section>

      {stats && (
        <section className="stats">
          {stats.map((s) => (
            <div key={s.label} className="stat">
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </section>
      )}

      <section className="stack">
        <h2 className="section-title">How it works</h2>
        <div className="steps">
          {steps.map((s, i) => (
            <div key={s.title} className="step">
              <div className="step-icon">{s.icon}</div>
              <Text weight="semibold" size={400}>
                {i + 1}. {s.title}
              </Text>
              <Text className="muted">{s.text}</Text>
            </div>
          ))}
        </div>
      </section>

      <section className="stack">
        <h2 className="section-title">Which platform fits your idea?</h2>
        <div className="grid-2">
          {PLATFORMS.map((p) => {
            const info = PLATFORM_INFO[p];
            return (
              <div key={p} className={`platform-card ${info.className}`}>
                <div className="row">
                  <span className="platform-card-icon">
                    <PlatformIcon platform={p} size={24} />
                  </span>
                  <Text size={500} weight="semibold">
                    {info.label}
                  </Text>
                </div>
                <Text>{info.summary}</Text>
                <ul className="reason-list">
                  {info.bestFor.map((b) => (
                    <li key={b}>
                      <CheckmarkCircleRegular /> {b}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
