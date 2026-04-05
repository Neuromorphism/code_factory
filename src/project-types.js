export const PROJECT_TYPES = [
  {
    id: "api-service",
    label: "API Service",
    summary: "Back-end services with contracts, persistence, background work, and operational concerns."
  },
  {
    id: "web-application",
    label: "Web Application",
    summary: "Interactive browser applications with APIs, state flows, and UI validation concerns."
  },
  {
    id: "developer-tooling",
    label: "Developer Tooling",
    summary: "CLIs, SDKs, automation, and internal developer platforms that optimize engineering workflows."
  }
];

const DEFAULT_WORK_ITEMS = {
  "api-service": [
    "Requirements intake | Capture functional scope, API consumers, security boundaries, and non-functional requirements | Required inputs are explicit; Open questions are visible; Constraints are preserved",
    "Contract planning | Define endpoints, schemas, error contracts, and dependency boundaries | Inputs and outputs are typed; Branch scope is isolated; Acceptance tests are named",
    "Implementation slice | Deliver the first production-ready API capability on its own branch | One capability is isolated; Side effects are tested; Rollback path is understood",
    "Validation workflow | Execute automated tests, fixture scenarios, and regression checks | Success criteria are automated; Failure states are visible; Results are attached",
    "Release artifact | Prepare the incremental PR plan and delivery notes for the completed slice | Branch name is final; Review notes are captured; Follow-on work is queued"
  ],
  "web-application": [
    "Experience intake | Capture user goals, critical screens, data dependencies, and accessibility constraints | Personas are explicit; State changes are named; Unknowns are tracked",
    "Flow planning | Break the feature into page or component milestones with API dependencies | Files per milestone are known; Interaction states are listed; Acceptance tests are named",
    "Implementation slice | Build one user-facing capability on an isolated branch | One flow is isolated; Empty and loading states exist; UI hooks to data safely",
    "Validation workflow | Run automated UI and integration tests with scenario data | User paths are exercised; Regressions are called out; Evidence is attached",
    "Release artifact | Prepare the incremental PR plan and review packet for the current slice | Branch scope is documented; Risks are called out; Next slice is ready"
  ],
  "developer-tooling": [
    "Tooling intake | Capture operator workflows, environments, and command or API expectations | Inputs are explicit; Failure modes are named; Constraints are preserved",
    "Milestone planning | Break the tool into command, service, or library increments with exact files | Entry points are known; Test targets are listed; Branches are assigned",
    "Implementation slice | Build one command or automation capability on an isolated branch | One responsibility is isolated; Logging is sufficient; Rollback is clear",
    "Validation workflow | Execute unit, integration, and scenario-driven automation tests | Happy path and edge paths are covered; Artifacts are captured; Failures are actionable",
    "Release artifact | Prepare the incremental PR plan and operator notes for the completed slice | Branch scope is documented; Reviewer notes are ready; Next increment is queued"
  ]
};

const SYNTHETIC_USER_SCENARIOS = {
  "api-service": [
    {
      id: "api-simple",
      label: "API User 1",
      complexity: "simple",
      systemName: "Session-backed notes API",
      desiredOutcome: "Ship a small authenticated notes API with one core CRUD slice.",
      constraints: ["Start with one endpoint family.", "Preserve branch-per-slice discipline."],
      functionsOrServices: [
        "Session middleware | Establish session-aware request context | Session context exists; Anonymous requests are rejected; User id is attached",
        "Notes create API | Create one note with validation and ownership | Payload is validated; Ownership is enforced; Response is typed",
        "Notes list API | List the active user's notes with stable sorting | Results are filtered by owner; Sorting is stable; Empty state is handled"
      ]
    },
    {
      id: "api-medium",
      label: "API User 2",
      complexity: "medium",
      systemName: "Audit-ready inventory service",
      desiredOutcome: "Ship inventory reservation flows with audit-friendly review and test loops.",
      constraints: ["Track risk-heavy state transitions.", "Use one branch per service slice."],
      functionsOrServices: [
        "Reservation policy | Define inventory reservation rules and state transitions | Rules are explicit; Edge states are named; Acceptance tests are listed",
        "Reservation endpoint | Reserve inventory for an order safely | Conflicts are rejected; Writes are atomic; Error payloads are consistent",
        "Audit events | Record user-visible audit entries for reservation changes | Events are ordered; Actor and timestamp exist; Query path is defined",
        "Regression tests | Validate reservation success, conflict, and rollback paths | Happy and conflict paths pass; Fixtures stay readable; Results are attached"
      ]
    },
    {
      id: "api-complex",
      label: "API User 3",
      complexity: "complex",
      systemName: "Multi-tenant workflow engine",
      desiredOutcome: "Ship a tenant-aware workflow execution slice with strict review and QA gates.",
      constraints: ["Protect tenant boundaries.", "Keep orchestration observable."],
      functionsOrServices: [
        "Tenant context service | Resolve tenant, actor, and request capabilities | Tenant resolution is deterministic; Permissions are visible; Errors are actionable",
        "Workflow definition API | Persist workflow definitions with schema checks | Definitions validate; Versioning is explicit; Invalid transitions fail fast",
        "Execution runner | Start one workflow execution and emit progress updates | Runs are isolated; Progress is reported; Timeouts are handled",
        "QA evidence pack | Aggregate tests and reviewer findings for release readiness | Evidence is complete; Risks are summarized; Follow-up work is queued"
      ]
    }
  ],
  "web-application": [
    {
      id: "web-simple",
      label: "Web User 1",
      complexity: "simple",
      systemName: "Customer success dashboard",
      desiredOutcome: "Ship a small dashboard with one actionable summary flow.",
      constraints: ["Favor clarity over breadth.", "Keep one feature per branch."],
      functionsOrServices: [
        "Dashboard brief | Capture target personas, summary metrics, and critical actions | Personas are named; Metrics are explicit; Actions are ranked",
        "Summary panel | Build one dashboard panel with loading and empty states | States are distinct; Data contract is explicit; Accessibility basics exist",
        "Scenario tests | Validate the main dashboard flow with synthetic users | Visible states are covered; Empty state passes; Errors are called out"
      ]
    },
    {
      id: "web-medium",
      label: "Web User 2",
      complexity: "medium",
      systemName: "Inspection review console",
      desiredOutcome: "Ship a review workflow with live status, annotations, and QA evidence.",
      constraints: ["Preserve keyboard efficiency.", "Keep review and test evidence visible."],
      functionsOrServices: [
        "Review workflow spec | Define reviewer roles, state transitions, and UI checkpoints | Checkpoints are explicit; Keyboard flows are named; Risks are tracked",
        "Annotation workspace | Build one annotation-and-review workspace slice | Focus order is valid; State changes are visible; Errors are recoverable",
        "Realtime progress panel | Surface live plan and role progress to the user | Active role is highlighted; Event stream updates; Reload is unnecessary",
        "UI validation pack | Run synthetic user flows with increasing complexity | Flow evidence is attached; Regressions are visible; Reviewer notes are captured"
      ]
    },
    {
      id: "web-complex",
      label: "Web User 3",
      complexity: "complex",
      systemName: "Cross-team release cockpit",
      desiredOutcome: "Ship a release planning and delivery cockpit with multi-role orchestration visibility.",
      constraints: ["Surface blockers early.", "Protect high-risk release actions."],
      functionsOrServices: [
        "Release intake | Capture release goals, blockers, and coordination rules | Stakeholders are explicit; Risks are visible; Ownership is clear",
        "Milestone board | Build an ordered milestone board with branch mapping | Branches are unique; Dependencies are visible; Milestones remain editable",
        "Role execution feed | Stream specialist role updates as work progresses | Feed is realtime; Status is stable; History is preserved",
        "Adversarial QA plan | Stress the release cockpit with increasingly difficult user scenarios | Baseline passes; Complex states remain usable; Review notes close gaps"
      ]
    }
  ],
  "developer-tooling": [
    {
      id: "tool-simple",
      label: "Tooling User 1",
      complexity: "simple",
      systemName: "Repo bootstrap CLI",
      desiredOutcome: "Ship one bootstrap command that scaffolds a new internal project safely.",
      constraints: ["Keep commands explicit.", "Avoid destructive defaults."],
      functionsOrServices: [
        "Bootstrap spec | Define the inputs, outputs, and safety checks for bootstrapping | Flags are explicit; Defaults are safe; Errors are actionable",
        "Bootstrap command | Implement one scaffolding command on an isolated branch | Output is deterministic; Existing files are respected; Logging is useful",
        "Command tests | Validate bootstrap success and guardrail behavior | Happy path passes; Existing-file guard passes; Help output is stable"
      ]
    },
    {
      id: "tool-medium",
      label: "Tooling User 2",
      complexity: "medium",
      systemName: "CI diagnostics runner",
      desiredOutcome: "Ship a runner that triages failing checks and produces reviewer-ready notes.",
      constraints: ["Keep external effects narrow.", "Make findings reproducible."],
      functionsOrServices: [
        "Diagnostics plan | Break CI diagnostics into bounded services and artifacts | Inputs are typed; Findings are structured; Branches are assigned",
        "Check parser | Parse failing checks and normalize diagnostics | Parsing is stable; Unknown states are handled; Results are serializable",
        "Review notes exporter | Emit reviewer-facing findings with severity and context | Severity is explicit; Notes are readable; Artifacts are reusable",
        "Scenario validation | Exercise simple, medium, and adversarial CI cases | Parser stays stable; Findings stay ranked; Reports are complete"
      ]
    },
    {
      id: "tool-complex",
      label: "Tooling User 3",
      complexity: "complex",
      systemName: "Agent-work delivery harness",
      desiredOutcome: "Ship a provider-agnostic harness for orchestrated software delivery with live progress.",
      constraints: ["Support future providers.", "Treat testing as a first-class role."],
      functionsOrServices: [
        "Harness spec | Define runtime abstractions, workflow roles, and branch strategy | Roles are fixed; Provider hooks are clear; Risks are named",
        "Backend contract | Implement pluggable backends for simulated and provider-specific agents | Contract is stable; Streaming events work; Failures are visible",
        "Realtime dashboard | Surface ordered plan, branch map, and live role progress | Plan is visible; Progress is realtime; Users can inspect artifacts",
        "Scenario pack | Validate the harness across multiple project archetypes and complexity levels | All archetypes pass; Artifacts are complete; Reviewer notes remain useful"
      ]
    }
  ]
};

export function getProjectType(projectTypeId) {
  return PROJECT_TYPES.find((projectType) => projectType.id === projectTypeId) ?? PROJECT_TYPES[0];
}

export function listProjectTypes() {
  return PROJECT_TYPES;
}

export function defaultFunctionsOrServicesFor(projectTypeId) {
  return (DEFAULT_WORK_ITEMS[projectTypeId] ?? DEFAULT_WORK_ITEMS["api-service"]).join("\n");
}

export function listSyntheticUsers(projectTypeId) {
  if (projectTypeId) {
    return SYNTHETIC_USER_SCENARIOS[projectTypeId] ?? [];
  }

  return Object.entries(SYNTHETIC_USER_SCENARIOS).flatMap(([type, scenarios]) =>
    scenarios.map((scenario) => ({
      ...scenario,
      projectType: type
    }))
  );
}
