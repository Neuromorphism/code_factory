import test from "node:test";
import assert from "node:assert/strict";
import { getExperimentBatch, listExperimentBatches } from "../src/experiments/experiment-batches.js";

test("experiment batches expose smoke and swap tournament presets", () => {
  const batches = listExperimentBatches();
  assert.ok(batches.length >= 10);
  assert.equal(getExperimentBatch("smoke").builderIds.includes("solo_builder"), true);
  assert.equal(getExperimentBatch("swap-arena").challengeIds.includes("rank-players"), true);
  assert.equal(getExperimentBatch("arena-circuit").challengeIds.includes("token-duel"), true);
  assert.equal(getExperimentBatch("arena-smoke").builderIds.includes("pipeline_five_stage"), true);
  assert.equal(getExperimentBatch("distributed-smoke").builderIds.includes("blackboard_collective"), true);
  assert.equal(getExperimentBatch("distributed-smoke").attackerIds.includes("gossip_breaker_mesh"), true);
  assert.equal(getExperimentBatch("parallel-systems-smoke").challengeIds.includes("ops-console-core"), true);
  assert.equal(getExperimentBatch("parallel-systems-smoke").builderIds.includes("parallel_clone_swarm"), true);
  assert.equal(getExperimentBatch("persona-cup").builderIds.includes("jury_red_team_builder"), true);
  assert.equal(getExperimentBatch("persona-smoke").attackerIds.includes("mutation_breaker"), true);
});
