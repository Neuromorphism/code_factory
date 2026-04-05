import test from "node:test";
import assert from "node:assert/strict";
import { createSession } from "../src/plan-service.js";
import { WORKFLOW_ROLE_IDS } from "../src/workflow-protocol.js";

test("createSession builds strict workflow roles and branch plans", () => {
  const session = createSession({
    projectType: "web-application",
    systemName: "Release cockpit",
    functionsOrServices: [
      "Session intake | Capture the release scope | Scope is explicit; Risks are visible",
      "Session intake | Capture another slice | Scope stays unique; Risks stay visible"
    ].join("\n")
  });

  assert.equal(session.projectType, "web-application");
  assert.equal(session.workflowProtocol.length, WORKFLOW_ROLE_IDS.length);
  assert.deepEqual(
    session.items[0].roles.map((role) => role.role),
    WORKFLOW_ROLE_IDS
  );
  assert.deepEqual(Object.keys(session.items[0].stageArtifacts), WORKFLOW_ROLE_IDS);
  assert.match(session.items[0].branch.name, /^factory\//);
  assert.notEqual(session.items[0].branch.name, session.items[1].branch.name);
  assert.equal(session.artifacts.incrementalPrPlan.length, 2);
  assert.equal(session.backendConfig.model, "gpt-5-codex");
});
