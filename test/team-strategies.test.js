import test from "node:test";
import assert from "node:assert/strict";
import { getTeamStrategy, listStrategiesByMode, listTeamStrategies } from "../src/experiments/team-strategies.js";

test("team strategy catalog exposes builder, breaker, and tester archetypes", () => {
  assert.ok(listTeamStrategies().length >= 12);
  assert.ok(listStrategiesByMode("build").length >= 7);
  assert.ok(listStrategiesByMode("break").length >= 4);
  assert.ok(listStrategiesByMode("test").length >= 2);
  assert.equal(getTeamStrategy("red_blue_builder").designMethod, "spec + plan + implement + adversarial review + repair");
  assert.equal(getTeamStrategy("repair_loop_builder").decisionRule, "require one explicit repair pass before shipping");
});
