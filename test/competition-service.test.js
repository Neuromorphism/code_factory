import test from "node:test";
import assert from "node:assert/strict";
import {
  createCompetitionSpec,
  recordCompetitionResult,
  summarizeCompetition
} from "../src/benchmark/competition-service.js";

test("competition service creates a pilot spec and ranks frameworks by resolution then time", () => {
  let competition = createCompetitionSpec({
    machineProfile: {
      memoryGiB: 125,
      vramGiB: 32
    }
  });

  competition = recordCompetitionResult(competition, {
    frameworkId: "codex-sdk",
    benchmarkCaseId: "case-1",
    resolved: true,
    durationSeconds: 120
  });
  competition = recordCompetitionResult(competition, {
    frameworkId: "codex-sdk",
    benchmarkCaseId: "case-2",
    resolved: false,
    durationSeconds: 240
  });
  competition = recordCompetitionResult(competition, {
    frameworkId: "langgraph-codex",
    benchmarkCaseId: "case-1",
    resolved: true,
    durationSeconds: 160
  });
  competition = recordCompetitionResult(competition, {
    frameworkId: "langgraph-codex",
    benchmarkCaseId: "case-2",
    resolved: true,
    durationSeconds: 180
  });

  const summarized = summarizeCompetition(competition);

  assert.equal(summarized.benchmark.name, "SWE-bench Lite");
  assert.equal(summarized.localModelPlan.hardwareAssessment.vramGiB, 32);
  assert.equal(summarized.summary[0].frameworkId, "langgraph-codex");
  assert.equal(summarized.summary[0].resolvedRate, 1);
  assert.equal(summarized.summary[1].frameworkId, "codex-sdk");
});
