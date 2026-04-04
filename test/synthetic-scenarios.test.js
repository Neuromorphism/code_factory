import test from "node:test";
import assert from "node:assert/strict";
import { listSyntheticUsers } from "../src/project-types.js";
import { createSimulatedOrchestrator } from "./helpers.js";

test("synthetic user matrix completes for every project type and complexity tier", async () => {
  const scenarios = listSyntheticUsers();

  assert.equal(scenarios.length, 9);

  for (const scenario of scenarios) {
    const { orchestrator, store, session } = createSimulatedOrchestrator({
      sessionSpec: {
        projectType: scenario.projectType,
        systemName: scenario.systemName,
        desiredOutcome: scenario.desiredOutcome,
        constraints: scenario.constraints.join("\n"),
        functionsOrServices: scenario.functionsOrServices.join("\n")
      },
      workspaceService: {
        prepareWorkspace: async () => ({
          path: `/tmp/${scenario.id}`,
          mode: "shared-repo",
          prepared: false,
          previewOnly: true,
          command: `Preview only: ${scenario.id}`
        })
      }
    });

    await orchestrator.startSession(session.id);
    const completed = store.getSession(session.id);

    assert.equal(completed.status, "complete", scenario.id);
    assert.equal(completed.summary.completedItems, completed.summary.totalItems, scenario.id);
    assert.ok(completed.items.every((item) => item.stageArtifacts.reviewer), scenario.id);
  }
});
