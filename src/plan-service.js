import { assignUniqueBranchNames } from "./branch-namer.js";
import { defaultFunctionsOrServicesFor, getProjectType } from "./project-types.js";
import { average, makeId, nowIso, splitLines } from "./utils.js";
import {
  createRoleAssignments,
  createRoleChecklist,
  createStageArtifacts,
  WORKFLOW_PROTOCOL
} from "./workflow-protocol.js";

function defaultAcceptanceCriteria(title) {
  return [
    `${title} is broken into concrete build steps.`,
    `${title} has an isolated branch strategy.`,
    `${title} passes through the full role sequence before the next item starts.`
  ];
}

function parseWorkItemLine(line) {
  const [titlePart, goalPart, criteriaPart] = line.split("|").map((part) => part.trim());
  const fallbackTitle = line.split(":")[0]?.trim() || "Work item";
  const fallbackGoal = line.includes(":")
    ? line.slice(line.indexOf(":") + 1).trim()
    : `Deliver ${fallbackTitle.toLowerCase()}.`;

  const title = titlePart || fallbackTitle;
  const goal = goalPart || fallbackGoal;
  const acceptanceCriteria = criteriaPart
    ? criteriaPart
        .split(";")
        .map((entry) => entry.trim())
        .filter(Boolean)
    : defaultAcceptanceCriteria(title);

  return { title, goal, acceptanceCriteria };
}

function buildTestStrategy(projectType, title) {
  switch (projectType) {
    case "web-application":
      return [
        `Render the main ${title.toLowerCase()} flow with synthetic user data.`,
        `Exercise loading, success, and error UI states for ${title.toLowerCase()}.`,
        `Verify live progress and review signals remain visible.`
      ];
    case "developer-tooling":
      return [
        `Exercise the ${title.toLowerCase()} path with a deterministic scenario fixture.`,
        `Validate failure handling and explicit operator feedback.`,
        `Record artifact outputs for reviewer inspection.`
      ];
    default:
      return [
        `Validate the ${title.toLowerCase()} happy path with synthetic API fixtures.`,
        `Exercise invalid-input and edge-state handling.`,
        `Record reviewer-facing evidence from the automated test run.`
      ];
  }
}

function buildIncrementalPrPlan(items) {
  return items.map((item) => ({
    sequence: item.order,
    workItemId: item.id,
    title: item.title,
    branchName: item.branch.name,
    prTitle: `feat: ${item.title.toLowerCase()}`,
    status: item.status,
    plannedFiles: [],
    requiredRoles: WORKFLOW_PROTOCOL.map((role) => role.label)
  }));
}

function createWorkItems(functionsOrServices, branchMode, baseBranch, projectType) {
  const parsedItems = splitLines(functionsOrServices).map(parseWorkItemLine);
  const branchNames = assignUniqueBranchNames(parsedItems, { prefix: "factory" });

  return parsedItems.map((item, index) => ({
    id: makeId("item"),
    order: index + 1,
    type: "function-or-service",
    title: item.title,
    goal: item.goal,
    acceptanceCriteria: item.acceptanceCriteria,
    status: "queued",
    progress: 0,
    activeRoleId: null,
    branch: {
      name: branchNames[index],
      mode: branchMode,
      base: baseBranch,
      exists: false,
      createdAt: null,
      command:
        branchMode === "create-local"
          ? `git branch ${branchNames[index]} ${baseBranch}`
          : `Preview only: git branch ${branchNames[index]} ${baseBranch}`
    },
    roles: createRoleAssignments(),
    checklist: createRoleChecklist(),
    artifacts: [],
    stageArtifacts: createStageArtifacts(),
    notes: [],
    testStrategy: buildTestStrategy(projectType, item.title),
    workspace: {
      path: null,
      mode: "unprepared",
      prepared: false,
      previewOnly: true,
      command: null
    },
    execution: {
      threadId: null
    },
    steps: [
      "Confirm scope with the user",
      "Produce the technical specification",
      "Break the work into milestone-sized implementation steps",
      "Implement on the isolated branch",
      "Run and inspect automated tests",
      "Perform skeptical reviewer validation"
    ]
  }));
}

export function createSession(spec = {}) {
  const createdAt = nowIso();
  const projectType = getProjectType(spec.projectType).id;
  const systemName = spec.systemName?.trim() || "Unnamed system";
  const desiredOutcome =
    spec.desiredOutcome?.trim() ||
    "Guide delivery from discovery through testing one function or service at a time.";
  const constraints = splitLines(spec.constraints);
  const branchMode = spec.branchMode === "create-local" ? "create-local" : "plan-only";
  const baseBranch = spec.baseBranch?.trim() || "main";
  const agentBackendId = spec.agentBackendId?.trim() || "simulated";
  const functionsOrServices =
    spec.functionsOrServices?.trim() || defaultFunctionsOrServicesFor(projectType);

  const items = createWorkItems(functionsOrServices, branchMode, baseBranch, projectType);

  return summarizeSession({
    id: makeId("session"),
    projectType,
    systemName,
    desiredOutcome,
    constraints,
    branchMode,
    baseBranch,
    agentBackendId,
    status: "draft",
    currentItemId: null,
    createdAt,
    updatedAt: createdAt,
    sourceSpec: {
      systemName,
      desiredOutcome,
      constraints: constraints.join("\n"),
      functionsOrServices,
      branchMode,
      baseBranch,
      projectType,
      agentBackendId
    },
    workflowProtocol: WORKFLOW_PROTOCOL,
    backendConfig: {
      model: "gpt-5-codex",
      sandboxMode: "workspace-write",
      approvalPolicy: "on-request",
      modelReasoningEffort: "medium",
      networkAccessEnabled: false,
      skipGitRepoCheck: true,
      additionalDirectories: []
    },
    items,
    artifacts: {
      incrementalPrPlan: buildIncrementalPrPlan(items)
    },
    nextEventSequence: 1,
    events: []
  });
}

export function summarizeSession(session) {
  const totalItems = session.items.length;
  const completedItems = session.items.filter((item) => item.status === "complete").length;
  const activeItems = session.items.filter((item) => item.status === "active").length;
  const activeRoles = session.items.flatMap((item) => item.roles).filter((role) => role.status === "running")
    .length;

  return {
    ...session,
    summary: {
      projectType: session.projectType,
      agentBackendId: session.agentBackendId,
      totalItems,
      completedItems,
      activeItems,
      activeRoles,
      overallProgress: average(session.items.map((item) => item.progress))
    }
  };
}

export function resetSession(session) {
  return createSession({
    ...session.sourceSpec
  });
}
