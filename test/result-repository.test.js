import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { createCompetitionSpec, recordCompetitionResult } from "../src/benchmark/competition-service.js";
import { CompetitionResultRepository } from "../src/benchmark/result-repository.js";
import { cleanupTempDir, makeTempDir } from "./helpers.js";

test("CompetitionResultRepository saves JSON and Markdown summaries for PR-able result artifacts", () => {
  const directory = makeTempDir();

  try {
    const repository = new CompetitionResultRepository({
      baseDir: path.join(directory, "competition-results")
    });
    let competition = createCompetitionSpec();
    competition = recordCompetitionResult(competition, {
      frameworkId: "codex-sdk",
      benchmarkCaseId: "case-1",
      resolved: true,
      durationSeconds: 90
    });

    const saved = repository.saveCompetition(competition);
    const results = repository.listResults();

    assert.equal(results.length, 1);
    assert.equal(results[0].summary[0].frameworkId, "codex-sdk");
    assert.match(saved.jsonPath, /\.json$/);
    assert.match(saved.mdPath, /\.md$/);
  } finally {
    cleanupTempDir(directory);
  }
});
