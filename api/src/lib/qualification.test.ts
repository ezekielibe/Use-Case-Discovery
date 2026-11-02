import { describe, expect, it } from "vitest";
import { qualify, type QualifyInput } from "./qualification";

const base: QualifyInput = {
  title: "",
  problem: "",
  desiredOutcome: "",
  currentProcess: "",
  dataSources: "",
  usersAffected: "11-50",
};

describe("qualify", () => {
  it("recommends Agent Builder for team knowledge Q&A", () => {
    const q = qualify({
      ...base,
      title: "HR policy assistant",
      problem: "People keep asking the same questions about leave policies",
      desiredOutcome: "Answer questions from the HR handbook",
      dataSources: "SharePoint",
      audience: "My team",
      capabilities: ["answer"],
    });
    expect(q.platform).toBe("agent-builder");
    expect(q.platformLabel).toBe("M365 Agent Builder");
    expect(q.confidence).toBe("High");
    expect(q.complexity).toBe("Low");
    expect(q.reasons.length).toBeGreaterThan(0);
  });

  it("recommends Copilot Studio for external, integrated, automated scenarios", () => {
    const q = qualify({
      ...base,
      title: "Customer order support",
      problem: "Customers call to check orders",
      desiredOutcome: "Raise a ticket in ServiceNow and send an email update automatically",
      usersAffected: "1000+",
      audience: "External customers or partners",
      capabilities: ["actions", "automation"],
    });
    expect(q.platform).toBe("copilot-studio");
    expect(q.confidence).toBe("High");
    expect(q.complexity).toBe("High");
    expect(q.reasons).toContain("Serves external customers or partners");
  });

  it("infers from free text when no structured answers are given", () => {
    const q = qualify({
      ...base,
      problem: "Approvals for purchase requests are slow",
      desiredOutcome: "Update the record in SAP and escalate overdue approvals",
      usersAffected: "201-1000",
    });
    expect(q.platform).toBe("copilot-studio");
  });

  it("defaults to Agent Builder with low effort when nothing complex is described", () => {
    const q = qualify({ ...base, title: "Idea" });
    expect(q.platform).toBe("agent-builder");
    expect(q.complexity).toBe("Low");
  });
});
