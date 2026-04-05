import { getProjectType } from "../project-types.js";
import { getWorkflowRole } from "../workflow-protocol.js";

const ROLE_TEMPLATES = {
  "spec-writer": ({ item, session, projectType }) => [
    {
      progress: 8,
      message: `Translated ${item.title} into a scoped technical slice for ${projectType.label.toLowerCase()}.`
    },
    {
      progress: 16,
      message: `Pinned contracts, constraints, and open questions for ${session.systemName}.`
    }
  ],
  planner: ({ item }) => [
    {
      progress: 24,
      message: `Mapped ${item.title} into milestone-sized work with exact acceptance criteria.`
    },
    {
      progress: 34,
      message: `Prepared branch scope, test targets, and reviewer checkpoints for ${item.title}.`
    }
  ],
  implementer: ({ item }) => [
    {
      progress: 46,
      message: `Implemented the narrowest useful slice for ${item.title}.`
    },
    {
      progress: 68,
      message: `Closed the implementation gaps and prepared the change for QA.`
    }
  ],
  "qa-tester": ({ item, projectType }) => [
    {
      progress: 78,
      message: `Ran automated validation for ${item.title} using ${projectType.label.toLowerCase()} scenarios.`
    },
    {
      progress: 88,
      message: `Recorded synthetic-user evidence and highlighted remaining QA risks.`
    }
  ],
  reviewer: ({ item }) => [
    {
      progress: 96,
      message: `Reviewed ${item.title} for regressions, security, and architectural drift.`
    },
    {
      progress: 100,
      message: `Reviewer accepted the work item and queued the next branch-ready slice.`
    }
  ]
};

function buildArtifacts(roleId, item, session) {
  switch (roleId) {
    case "spec-writer":
      return [
        {
          kind: "spec",
          title: `${item.title} technical spec`,
          summary: `Technical contract for ${item.title} in ${session.systemName}.`
        }
      ];
    case "planner":
      return [
        {
          kind: "milestone-plan",
          title: `${item.title} milestone plan`,
          summary: `Exact implementation and test steps for ${item.title}.`
        }
      ];
    case "implementer":
      return [
        {
          kind: "implementation-note",
          title: `${item.title} implementation note`,
          summary: `Scoped change set prepared for isolated branch ${item.branch.name}.`
        }
      ];
    case "qa-tester":
      return [
        {
          kind: "qa-report",
          title: `${item.title} QA report`,
          summary: `Synthetic scenarios exercised for ${item.title}.`
        }
      ];
    case "reviewer":
      return [
        {
          kind: "review-note",
          title: `${item.title} reviewer note`,
          summary: `Reviewer findings captured for ${item.title}.`
        }
      ];
    default:
      return [];
  }
}

export class SimulatedAgentBackend {
  constructor({ stepDelayMs = 150 } = {}) {
    this.id = "simulated";
    this.label = "Simulated Backend";
    this.provider = "local";
    this.kind = "simulation";
    this.stepDelayMs = stepDelayMs;
  }

  descriptor() {
    return {
      id: this.id,
      label: this.label,
      provider: this.provider,
      kind: this.kind,
      available: true,
      configurable: false,
      summary: "Deterministic local backend for demos, tests, and contract-first development."
    };
  }

  async *runRole({ session, item, roleId, delayMs = this.stepDelayMs }) {
    const projectType = getProjectType(session.projectType);
    const role = getWorkflowRole(roleId);
    const steps = ROLE_TEMPLATES[roleId]?.({ session, item, projectType }) ?? [];

    for (const step of steps) {
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      yield {
        type: "log",
        progress: step.progress,
        message: step.message
      };
    }

    for (const artifact of buildArtifacts(roleId, item, session)) {
      yield {
        type: "artifact",
        message: `${role.label} produced ${artifact.kind} output.`,
        artifact
      };
    }

    if (role?.checklistKey) {
      yield {
        type: "checklist",
        message: `${role.label} marked ${role.checklistKey} complete.`,
        checklistKey: role.checklistKey,
        value: true
      };
    }
  }
}
