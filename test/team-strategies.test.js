import test from "node:test";
import assert from "node:assert/strict";
import { getTeamStrategy, listStrategiesByMode, listTeamStrategies } from "../src/experiments/team-strategies.js";

test("team strategy catalog exposes builder, breaker, and tester archetypes", () => {
  assert.ok(listTeamStrategies().length >= 20);
  assert.ok(listStrategiesByMode("build").length >= 14);
  assert.ok(listStrategiesByMode("break").length >= 5);
  assert.ok(listStrategiesByMode("test").length >= 3);
  assert.equal(getTeamStrategy("red_blue_builder").designMethod, "spec + plan + implement + adversarial review + repair");
  assert.equal(getTeamStrategy("repair_loop_builder").decisionRule, "require one explicit repair pass before shipping");
  assert.equal(getTeamStrategy("universalist_solo").topology, "single-node");
  assert.equal(getTeamStrategy("blackboard_collective").topology, "decentralized");
  assert.equal(getTeamStrategy("gossip_mesh").memoryModel, "gossip digest");
  assert.equal(getTeamStrategy("crdt_mesh").memoryModel, "append-only CRDT hypothesis log");
  assert.equal(getTeamStrategy("parallel_clone_swarm").phases.filter((phase) => phase.wave === "parallel_build").length, 4);
  assert.equal(getTeamStrategy("collab_pod_builder").phases.filter((phase) => phase.wave === "pod_build").length, 4);
  assert.equal(getTeamStrategy("gossip_breaker_mesh").taskDistribution, "broadcast_all");
  assert.equal(getTeamStrategy("stigmergy_test_hive").topology, "decentralized");
});
