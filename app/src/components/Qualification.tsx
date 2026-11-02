import { Badge, Text, Tooltip } from "@fluentui/react-components";
import { BotSparkleRegular, CheckmarkCircleRegular, FlowRegular } from "@fluentui/react-icons";
import type { Platform, Qualification } from "../types";

export const PLATFORM_INFO: Record<Platform, { label: string; className: string; summary: string; bestFor: string[] }> = {
  "agent-builder": {
    label: "M365 Agent Builder",
    className: "platform-builder",
    summary: "Quick, no-code agents in Microsoft 365 Copilot for knowledge Q&A and personal or team productivity.",
    bestFor: [
      "Q&A over SharePoint, files or websites",
      "Personal and team productivity",
      "Drafting and summarising content",
      "Built in minutes using natural language",
    ],
  },
  "copilot-studio": {
    label: "Copilot Studio",
    className: "platform-studio",
    summary:
      "Full low-code platform for agents that take actions, run workflows, integrate with business systems or serve external users.",
    bestFor: [
      "Actions in business systems via 1,000+ connectors",
      "Multi-step workflows and approvals",
      "Autonomous, event-triggered agents",
      "External channels: websites, Teams, WhatsApp and more",
    ],
  },
};

export function PlatformIcon({ platform, size = 16 }: { platform: Platform; size?: number }) {
  return platform === "copilot-studio" ? <FlowRegular fontSize={size} /> : <BotSparkleRegular fontSize={size} />;
}

export function PlatformBadge({ qualification }: { qualification: Qualification }) {
  const info = PLATFORM_INFO[qualification.platform];
  return (
    <Tooltip
      relationship="description"
      content={
        <div>
          <strong>Why {info.label}?</strong>
          <ul className="reason-list">
            {qualification.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      }
    >
      <span className={`platform-badge ${info.className}`} tabIndex={0}>
        <PlatformIcon platform={qualification.platform} />
        {info.label}
      </span>
    </Tooltip>
  );
}

export function QualificationCard({ qualification }: { qualification: Qualification }) {
  const info = PLATFORM_INFO[qualification.platform];
  return (
    <div className={`qualification-card ${info.className}`}>
      <div className="row">
        <PlatformIcon platform={qualification.platform} size={28} />
        <div>
          <Text size={200} className="muted">
            Recommended platform
          </Text>
          <Text as="p" size={500} weight="semibold" style={{ margin: 0 }}>
            {info.label}
          </Text>
        </div>
      </div>
      <Text size={300}>{info.summary}</Text>
      <div className="row">
        <Badge appearance="tint" color="informative">
          Confidence: {qualification.confidence}
        </Badge>
        <Badge appearance="tint" color={qualification.complexity === "High" ? "warning" : "success"}>
          Build complexity: {qualification.complexity}
        </Badge>
      </div>
      <ul className="reason-list">
        {qualification.reasons.map((r) => (
          <li key={r}>
            <CheckmarkCircleRegular /> {r}
          </li>
        ))}
      </ul>
    </div>
  );
}
