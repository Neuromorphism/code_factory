import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { AgentBackendRegistry } from "../src/backend-registry.js";
import { SimulatedAgentBackend } from "../src/agent-backends/simulated-backend.js";
import { HarnessOrchestrator } from "../src/orchestrator.js";
import { createSession } from "../src/plan-service.js";
import { HarnessStore } from "../src/store.js";

export function makeTempDir(prefix = "code-factory-test-") {
  return mkdtempSync(path.join(os.tmpdir(), prefix));
}

export function cleanupTempDir(directory) {
  rmSync(directory, { recursive: true, force: true });
}

export function createSimulatedOrchestrator({ sessionSpec, workspaceService }) {
  const store = new HarnessStore();
  const session = store.createSession(
    createSession({
      agentBackendId: "simulated",
      ...sessionSpec
    })
  );

  const orchestrator = new HarnessOrchestrator({
    store,
    backendRegistry: new AgentBackendRegistry({
      backends: [new SimulatedAgentBackend({ stepDelayMs: 0 })]
    }),
    workspaceService,
    gitServiceFactory: () => ({
      isRepository: async () => true
    }),
    stepDelayMs: 0
  });

  return {
    store,
    session,
    orchestrator
  };
}
