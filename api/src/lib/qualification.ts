export const CAPABILITIES = [
  { key: "answer", label: "Answer questions from documents or knowledge" },
  { key: "content", label: "Draft, summarise or rewrite content" },
  { key: "actions", label: "Take actions in other systems (create, update, submit)" },
  { key: "workflow", label: "Run multi-step processes or approvals" },
  { key: "automation", label: "Run automatically on a schedule or event" },
] as const;

export const AUDIENCES = ["Just me", "My team", "My whole organisation", "External customers or partners"];

export type Platform = "agent-builder" | "copilot-studio";

export const PLATFORM_LABELS: Record<Platform, string> = {
  "agent-builder": "M365 Agent Builder",
  "copilot-studio": "Copilot Studio",
};

export interface Qualification {
  platform: Platform;
  platformLabel: string;
  confidence: "High" | "Medium" | "Low";
  complexity: "Low" | "Medium" | "High";
  reasons: string[];
}

export interface QualifyInput {
  title: string;
  problem: string;
  desiredOutcome: string;
  currentProcess: string;
  dataSources: string;
  usersAffected: string;
  audience?: string;
  capabilities?: string[];
}

const PATTERNS = {
  systems:
    /\b(servicenow|sap|salesforce|dynamics(?: 365)?|dataverse|workday|jira|oracle|sql|database|erp|crm|hubspot|zendesk|api|web ?services?)\b/i,
  actions:
    /\b((create|raise|log|open) (a |an )?(ticket|case|request|incident|record|order)|update (the |a )?(record|ticket|status|system|crm)|book (a |an )?\w+|approv(e|al|als)|place (an )?order|reset (a )?password|escalat(e|ion)|send (an )?(email|notification)s?)\b/i,
  automation:
    /\b(automatic(ally)?|autonomous(ly)?|every (day|week|morning|month|hour)|on a schedule|scheduled|when (a|an) new|whenever|in the background|triggers?|triggered|monitor(s|ing)?)\b/i,
  external:
    /\b(customers?|clients?|citizens?|public|partners?|suppliers?|vendors?|website|whatsapp|sms|call cent(er|re)|external)\b/i,
  knowledge:
    /\b(sharepoint|onedrive|documents?|polic(y|ies)|faqs?|knowledge|guidelines?|handbook|manuals?|procedures?|wiki|intranet|pdfs?|onboarding|training)\b/i,
  content: /\b(summari[sz]e|summary|summaries|draft|rewrite|meeting notes|translate|proofread)\b/i,
};

const LARGE_GROUPS = ["201-1000", "1000+"];
const SMALL_GROUPS = ["1-10", "11-50"];

export function qualify(input: QualifyInput): Qualification {
  const text = [input.title, input.problem, input.desiredOutcome, input.currentProcess, input.dataSources].join(" ");
  const caps = new Set(input.capabilities ?? []);
  const studio = { score: 0, reasons: [] as string[] };
  const builder = { score: 0, reasons: [] as string[] };
  const add = (side: typeof studio, points: number, reason: string) => {
    side.score += points;
    side.reasons.push(reason);
  };

  const system = text.match(PATTERNS.systems)?.[0];
  if (caps.has("actions")) add(studio, 3, "Needs to take actions in other systems");
  else if (PATTERNS.actions.test(text)) add(studio, 2, "Describes actions such as creating or updating records");
  if (caps.has("workflow")) add(studio, 3, "Involves multi-step processes or approvals");
  if (caps.has("automation")) add(studio, 3, "Should run autonomously on a schedule or event");
  else if (PATTERNS.automation.test(text)) add(studio, 2, "Mentions automatic or event-driven behaviour");
  if (system) add(studio, 2, `Integrates with business systems (${system})`);
  if (input.audience === "External customers or partners") add(studio, 4, "Serves external customers or partners");
  else if (!input.audience && PATTERNS.external.test(text)) add(studio, 1, "May involve external users");
  if (input.audience === "My whole organisation" || LARGE_GROUPS.includes(input.usersAffected)) {
    add(studio, 1, "Large audience benefits from managed deployment and analytics");
  }

  if (caps.has("answer")) add(builder, 3, "Answers questions from documents or knowledge");
  else if (PATTERNS.knowledge.test(text)) add(builder, 2, "Grounded in documents or knowledge sources (e.g. SharePoint)");
  if (caps.has("content")) add(builder, 2, "Helps draft or summarise content");
  else if (PATTERNS.content.test(text)) add(builder, 1, "Involves drafting or summarising content");
  if (input.audience === "Just me" || input.audience === "My team") add(builder, 2, "Personal or team productivity scenario");
  if (SMALL_GROUPS.includes(input.usersAffected)) add(builder, 1, "Small, focused user group");
  if (!system && !caps.has("actions") && !caps.has("automation")) {
    add(builder, 2, "No complex integrations or automation required");
  }

  const platform: Platform = studio.score > builder.score ? "copilot-studio" : "agent-builder";
  const margin = Math.abs(studio.score - builder.score);
  return {
    platform,
    platformLabel: PLATFORM_LABELS[platform],
    confidence: margin >= 4 ? "High" : margin >= 2 ? "Medium" : "Low",
    complexity: studio.score >= 7 ? "High" : studio.score >= 3 ? "Medium" : "Low",
    reasons: (platform === "copilot-studio" ? studio : builder).reasons.slice(0, 4),
  };
}
