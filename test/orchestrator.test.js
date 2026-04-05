import test from "node:test";
import assert from "node:assert/strict";
import { createSimulatedOrchestrator } from "./helpers.js";

test("HarnessOrchestrator runs the full strict role sequence and records artifacts", async () => {
  const { orchestrator, store, session } = createSimulatedOrchestrator({
    sessionSpec: {
      projectType: "developer-tooling",
      systemName: "Harness under test"
    },
    workspaceService: {
      prepareWorkspace: async () => ({
        path: "/tmp/workspace",
        mode: "shared-repo",
        prepared: false,
        previewOnly: true,
        command: "Preview only: git worktree add ..."
      })
    }
  });

  await orchestrator.startSession(session.id);
  const completed = store.getSession(session.id);
  const firstItem = completed.items[0];

  assert.equal(completed.status, "complete");
  assert.equal(firstItem.status, "complete");
  assert.equal(firstItem.progress, 100);
  assert.equal(firstItem.checklist.specReady, true);
  assert.equal(firstItem.checklist.planReady, true);
  assert.equal(firstItem.checklist.implementationReady, true);
  assert.equal(firstItem.checklist.qaReady, true);
  assert.equal(firstItem.checklist.reviewReady, true);
  assert.ok(firstItem.stageArtifacts["spec-writer"]);
  assert.ok(firstItem.stageArtifacts.planner);
  assert.ok(firstItem.stageArtifacts.implementer);
  assert.ok(firstItem.stageArtifacts["qa-tester"]);
  assert.ok(firstItem.stageArtifacts.reviewer);
  assert.deepEqual(
    completed.events.map((event) => event.sequence),
    completed.events.map((_, index) => index + 1)
  );
});
