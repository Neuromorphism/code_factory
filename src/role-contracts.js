const COMMON_RESPONSE_PROPERTIES = {
  summary: { type: "string" },
  risks: {
    type: "array",
    items: { type: "string" }
  },
  handoffNotes: {
    type: "array",
    items: { type: "string" }
  }
};

export function roleOutputSchema(roleId) {
  switch (roleId) {
    case "spec-writer":
      return {
        type: "object",
        properties: {
          ...COMMON_RESPONSE_PROPERTIES,
          apiSignatures: {
            type: "array",
            items: { type: "string" }
          },
          dataModelChanges: {
            type: "array",
            items: { type: "string" }
          },
          logicChanges: {
            type: "array",
            items: { type: "string" }
          },
          openQuestions: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["summary", "apiSignatures", "dataModelChanges", "logicChanges", "openQuestions", "risks", "handoffNotes"],
        additionalProperties: false
      };
    case "planner":
      return {
        type: "object",
        properties: {
          ...COMMON_RESPONSE_PROPERTIES,
          milestones: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                files: {
                  type: "array",
                  items: { type: "string" }
                },
                tests: {
                  type: "array",
                  items: { type: "string" }
                }
              },
              required: ["title", "files", "tests"],
              additionalProperties: false
            }
          }
        },
        required: ["summary", "milestones", "risks", "handoffNotes"],
        additionalProperties: false
      };
    case "implementer":
      return {
        type: "object",
        properties: {
          ...COMMON_RESPONSE_PROPERTIES,
          filesChanged: {
            type: "array",
            items: { type: "string" }
          },
          commandsRun: {
            type: "array",
            items: { type: "string" }
          },
          testsSuggested: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["summary", "filesChanged", "commandsRun", "testsSuggested", "risks", "handoffNotes"],
        additionalProperties: false
      };
    case "qa-tester":
      return {
        type: "object",
        properties: {
          ...COMMON_RESPONSE_PROPERTIES,
          testsExecuted: {
            type: "array",
            items: { type: "string" }
          },
          visualChecks: {
            type: "array",
            items: { type: "string" }
          },
          decision: {
            type: "string",
            enum: ["pass", "fail", "blocked"]
          }
        },
        required: ["summary", "testsExecuted", "visualChecks", "decision", "risks", "handoffNotes"],
        additionalProperties: false
      };
    case "reviewer":
      return {
        type: "object",
        properties: {
          ...COMMON_RESPONSE_PROPERTIES,
          findings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                severity: { type: "string", enum: ["low", "medium", "high"] },
                detail: { type: "string" }
              },
              required: ["severity", "detail"],
              additionalProperties: false
            }
          },
          decision: {
            type: "string",
            enum: ["approved", "changes_requested"]
          }
        },
        required: ["summary", "findings", "decision", "risks", "handoffNotes"],
        additionalProperties: false
      };
    default:
      return {
        type: "object",
        properties: COMMON_RESPONSE_PROPERTIES,
        required: ["summary", "risks", "handoffNotes"],
        additionalProperties: false
      };
  }
}

export function buildRolePrompt({ session, item, role }) {
  const priorArtifacts = Object.entries(item.stageArtifacts ?? {})
    .filter(([, artifact]) => artifact)
    .map(([artifactRoleId, artifact]) => `${artifactRoleId}: ${JSON.stringify(artifact.data ?? artifact)}`)
    .join("\n");

  const milestonePlan =
    item.stageArtifacts?.planner?.data?.milestones
      ?.map((milestone, index) => `${index + 1}. ${milestone.title} | files: ${milestone.files.join(", ")} | tests: ${milestone.tests.join(", ")}`)
      .join("\n") ?? "No milestone plan yet.";

  return [
    `You are the ${role.label} role in a strict multi-stage software delivery harness.`,
    `Project type: ${session.projectType}`,
    `System: ${session.systemName}`,
    `Desired outcome: ${session.desiredOutcome}`,
    `Current work item: ${item.title}`,
    `Work item goal: ${item.goal}`,
    `Acceptance criteria:`,
    ...item.acceptanceCriteria.map((criterion) => `- ${criterion}`),
    `Branch plan: ${item.branch.command}`,
    `Workspace path: ${item.workspace.path || "Use the repository root or configured worktree."}`,
    `Role objective: ${role.objective}`,
    `Required output: respond with JSON matching the provided schema only.`,
    `Focus on one function or service at a time.`,
    `Test strategy for this item:`,
    ...item.testStrategy.map((entry) => `- ${entry}`),
    `Existing milestone plan:`,
    milestonePlan,
    `Prior stage artifacts:`,
    priorArtifacts || "None yet."
  ].join("\n");
}

export function safeParseStructuredOutput(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
