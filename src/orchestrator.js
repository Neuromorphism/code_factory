import { getWorkflowRole, WORKFLOW_ROLE_IDS } from "./workflow-protocol.js";
import { resetSession } from "./plan-service.js";

export class HarnessOrchestrator {
  constructor({
    store,
    gitServiceFactory,
    workspaceService,
    backendRegistry,
    stepDelayMs = 150
  } = {}) {
    this.store = store;
    this.gitServiceFactory = gitServiceFactory;
    this.workspaceService = workspaceService;
    this.backendRegistry = backendRegistry;
    this.stepDelayMs = stepDelayMs;
    this.runningSessions = new Set();
  }

  async startSession(sessionId) {
    if (this.runningSessions.has(sessionId)) {
      return this.store.getSession(sessionId);
    }

    const session = this.store.getSession(sessionId);
    if (!session) {
      throw new Error(`Unknown session: ${sessionId}`);
    }

    this.runningSessions.add(sessionId);
    this.store.updateSession(sessionId, (draft) => {
      draft.status = "running";
    });
    this.store.publish({
      sessionId,
      type: "session-started",
      message: "Started orchestration for the session."
    });

    try {
      const latest = this.store.getSession(sessionId);
      for (const item of latest.items) {
        await this.runItem(sessionId, item.id);
      }

      this.store.updateSession(sessionId, (draft) => {
        draft.status = "complete";
        draft.currentItemId = null;
      });
      this.store.publish({
        sessionId,
        type: "session-complete",
        message: "All work items reached review and testing completion."
      });
    } finally {
      this.runningSessions.delete(sessionId);
    }

    return this.store.getSession(sessionId);
  }

  resetSession(sessionId) {
    const current = this.store.getSession(sessionId);
    if (!current) {
      throw new Error(`Unknown session: ${sessionId}`);
    }

    if (this.runningSessions.has(sessionId)) {
      throw new Error("Cannot reset a session while it is running.");
    }

    const next = resetSession(current);
    this.store.replaceSession(sessionId, {
      ...next,
      id: sessionId,
      createdAt: current.createdAt
    });
    this.store.publish({
      sessionId,
      type: "session-reset",
      message: "Reset the session back to a draft plan."
    });

    return this.store.getSession(sessionId);
  }

  async runItem(sessionId, itemId) {
    this.store.updateSession(sessionId, (draft) => {
      draft.currentItemId = itemId;
      const item = draft.items.find((entry) => entry.id === itemId);
      item.status = "active";
      item.progress = Math.max(item.progress, 2);
    });

    const session = this.store.getSession(sessionId);
    const item = session.items.find((entry) => entry.id === itemId);

    this.store.publish({
      sessionId,
      itemId,
      type: "item-started",
      message: `Started ${item.title}.`
    });

    await this.ensureWorkspace(session, item);

    for (const roleId of WORKFLOW_ROLE_IDS) {
      await this.runRole(sessionId, itemId, roleId);
    }

    this.store.updateSession(sessionId, (draft) => {
      const currentItem = draft.items.find((entry) => entry.id === itemId);
      currentItem.status = "complete";
      currentItem.progress = 100;
      draft.currentItemId = null;
    });

    this.store.publish({
      sessionId,
      itemId,
      type: "item-complete",
      message: `Completed ${item.title}.`
    });
  }

  async ensureWorkspace(session, item) {
    const workspace = await this.workspaceService.prepareWorkspace(session, item);

    this.store.updateSession(session.id, (draft) => {
      const currentItem = draft.items.find((entry) => entry.id === item.id);
      currentItem.workspace = workspace;
    });

    if (workspace.previewOnly) {
      this.store.publish({
        sessionId: session.id,
        itemId: item.id,
        type: "workspace-preview",
        message: workspace.command
      });
      return;
    }

    this.store.updateSession(session.id, (draft) => {
      const currentItem = draft.items.find((entry) => entry.id === item.id);
      currentItem.branch.exists = true;
      currentItem.branch.createdAt = new Date().toISOString();
      currentItem.branch.command = workspace.command;
    });
    this.store.publish({
      sessionId: session.id,
      itemId: item.id,
      type: workspace.prepared ? "workspace-ready" : "workspace-reused",
      message: `Workspace prepared at ${workspace.path}.`
    });
  }

  async runRole(sessionId, itemId, roleId) {
    const liveSession = this.store.getSession(sessionId);
    const backend = this.backendRegistry.getExecutionBackend(liveSession.agentBackendId);
    const roleDefinition = getWorkflowRole(roleId);

    this.store.updateSession(sessionId, (draft) => {
      const item = draft.items.find((entry) => entry.id === itemId);
      const role = item.roles.find((entry) => entry.role === roleId);
      role.status = "running";
      role.startedAt = new Date().toISOString();
      item.activeRoleId = roleId;
    });

    this.store.publish({
      sessionId,
      itemId,
      role: roleId,
      type: "role-started",
      message: `${roleDefinition.label} started on the current item.`
    });

    const snapshot = this.store.getSession(sessionId);
    const item = snapshot.items.find((entry) => entry.id === itemId);

    for await (const backendEvent of backend.runRole({
      session: snapshot,
      item,
      roleId,
      workspace: item.workspace,
      backendConfig: snapshot.backendConfig,
      delayMs: this.stepDelayMs
    })) {
      this.applyBackendEvent(sessionId, itemId, roleId, backendEvent);
    }

    this.store.updateSession(sessionId, (draft) => {
      const item = draft.items.find((entry) => entry.id === itemId);
      const role = item.roles.find((entry) => entry.role === roleId);
      role.status = "complete";
      role.completedAt = new Date().toISOString();
      item.activeRoleId = null;
    });

    this.store.publish({
      sessionId,
      itemId,
      role: roleId,
      type: "role-complete",
      message: `${roleDefinition.label} completed the current item.`
    });
  }

  applyBackendEvent(sessionId, itemId, roleId, backendEvent) {
    this.store.updateSession(sessionId, (draft) => {
      const item = draft.items.find((entry) => entry.id === itemId);
      const role = item.roles.find((entry) => entry.role === roleId);

      if (backendEvent.message) {
        role.logs = [...role.logs, { createdAt: new Date().toISOString(), message: backendEvent.message }];
      }

      if (typeof backendEvent.progress === "number") {
        item.progress = Math.max(item.progress, backendEvent.progress);
      }

      if (backendEvent.type === "artifact" && backendEvent.artifact) {
        role.artifacts = [...role.artifacts, backendEvent.artifact];
        item.artifacts = [...item.artifacts, backendEvent.artifact];
        item.stageArtifacts[roleId] = backendEvent.artifact;
      }

      if (backendEvent.type === "checklist" && backendEvent.checklistKey) {
        item.checklist[backendEvent.checklistKey] = backendEvent.value;
      }

      if (backendEvent.type === "state" && backendEvent.state?.threadId) {
        item.execution.threadId = backendEvent.state.threadId;
      }
    });

    this.store.publish({
      sessionId,
      itemId,
      role: roleId,
      type: backendEvent.type === "artifact" ? "role-artifact" : "role-progress",
      message: backendEvent.message
    });
  }
}
