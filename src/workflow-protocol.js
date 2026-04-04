import { makeId } from "./utils.js";

export const WORKFLOW_PROTOCOL = [
  {
    id: "spec-writer",
    label: "Spec Writer",
    objective: "Convert the user brief into a concrete technical specification for the current work item.",
    progressCeiling: 18,
    checklistKey: "specReady"
  },
  {
    id: "planner",
    label: "Planner",
    objective: "Break the work item into milestone-sized implementation steps with explicit files and tests.",
    progressCeiling: 34,
    checklistKey: "planReady"
  },
  {
    id: "implementer",
    label: "Implementer",
    objective: "Implement the current milestone on an isolated branch with narrowly scoped changes.",
    progressCeiling: 68,
    checklistKey: "implementationReady"
  },
  {
    id: "qa-tester",
    label: "QA / Tester",
    objective: "Validate the change with automated tests and scenario-driven verification.",
    progressCeiling: 88,
    checklistKey: "qaReady"
  },
  {
    id: "reviewer",
    label: "Reviewer",
    objective: "Perform skeptical review for edge cases, security risks, regressions, and architecture quality.",
    progressCeiling: 100,
    checklistKey: "reviewReady"
  }
];

export const WORKFLOW_ROLE_IDS = WORKFLOW_PROTOCOL.map((role) => role.id);

export function getWorkflowRole(roleId) {
  return WORKFLOW_PROTOCOL.find((role) => role.id === roleId) ?? null;
}

export function createRoleAssignments() {
  return WORKFLOW_PROTOCOL.map((role) => ({
    id: makeId(role.id),
    role: role.id,
    label: role.label,
    objective: role.objective,
    status: "queued",
    logs: [],
    artifacts: [],
    startedAt: null,
    completedAt: null
  }));
}

export function createRoleChecklist() {
  return WORKFLOW_PROTOCOL.reduce((checklist, role) => {
    checklist[role.checklistKey] = false;
    return checklist;
  }, {});
}

export function createStageArtifacts() {
  return WORKFLOW_PROTOCOL.reduce((artifacts, role) => {
    artifacts[role.id] = null;
    return artifacts;
  }, {});
}
