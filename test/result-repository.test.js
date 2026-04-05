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

test("CompetitionResultRepository saves tournament artifacts for league and persona tracking", () => {
  const directory = makeTempDir();

  try {
    const repository = new CompetitionResultRepository({
      baseDir: path.join(directory, "competition-results")
    });

    const saved = repository.saveTournamentArtifact({
      batchId: "persona-cup",
      tournament: {
        id: "tournament-123",
        createdAt: "2026-04-04T00:00:00.000Z",
        completedAt: "2026-04-04T00:10:00.000Z",
        enablePersonas: true,
        enableFixRounds: true,
        summaries: {
          overall: [{ label: "Repair Loop Builder", compositeScore: 21 }]
        }
      },
      league: {
        style: { label: "Build-It Break-It Fix-It" },
        standings: [{ team: "Repair Loop Builder", totalScore: 21 }]
      },
      season: {
        overallStandings: [{ team: "Repair Loop Builder", seasonPoints: 10, eventWins: 1, podiums: 1 }]
      },
      personaComparison: {
        baselineOverall: [{ label: "Repair Loop Builder", compositeScore: 18 }],
        personaOverall: [{ label: "Repair Loop Builder", compositeScore: 21 }]
      }
    });

    const artifacts = repository.listTournamentArtifacts();

    assert.equal(artifacts.length, 1);
    assert.equal(artifacts[0].batchId, "persona-cup");
    assert.equal(artifacts[0].enablePersonas, true);
    assert.match(saved.jsonPath, /tournaments\/.*\.json$/);
    assert.match(saved.mdPath, /tournaments\/.*\.md$/);
  } finally {
    cleanupTempDir(directory);
  }
});

test("CompetitionResultRepository saves tournament artifacts in a dedicated directory", () => {
  const directory = makeTempDir();

  try {
    const repository = new CompetitionResultRepository({
      baseDir: path.join(directory, "competition-results")
    });
    const saved = repository.saveTournamentArtifact({
      batchId: "persona-cup",
      tournament: {
        id: "tournament-1",
        createdAt: "2026-04-04T10:00:00.000Z",
        completedAt: "2026-04-04T10:05:00.000Z",
        enablePersonas: true,
        enableFixRounds: true,
        summaries: {
          overall: [{ label: "Alpha", compositeScore: 12 }]
        }
      },
      league: {
        style: { label: "ICPC Sprint" },
        standings: [{ team: "Alpha", solved: 2 }]
      },
      season: {
        overallStandings: [{ team: "Alpha", seasonPoints: 10, eventWins: 1, podiums: 1 }]
      }
    });

    assert.match(saved.jsonPath, /tournaments\/.*\.json$/);
    assert.equal(repository.listTournamentArtifacts().length, 1);
  } finally {
    cleanupTempDir(directory);
  }
});

test("CompetitionResultRepository saves tournament artifacts with league and persona metadata", () => {
  const directory = makeTempDir();

  try {
    const repository = new CompetitionResultRepository({
      baseDir: path.join(directory, "competition-results")
    });

    const saved = repository.saveTournamentArtifact({
      batchId: "persona-cup",
      tournament: {
        id: "tournament-123",
        createdAt: "2026-04-04T00:00:00.000Z",
        completedAt: "2026-04-04T01:00:00.000Z",
        enablePersonas: true,
        enableFixRounds: true,
        summaries: {
          overall: [{ label: "Alpha", compositeScore: 42 }]
        }
      },
      league: {
        style: { label: "Build-It Break-It Fix-It" },
        standings: [{ team: "Alpha", totalScore: 42 }]
      },
      season: {
        overallStandings: [{ team: "Alpha", seasonPoints: 10, eventWins: 1, podiums: 1 }]
      },
      personaComparison: {
        baselineOverall: [],
        personaOverall: []
      }
    });

    assert.match(saved.jsonPath, /tournaments\/.*\.json$/);
    assert.match(saved.mdPath, /tournaments\/.*\.md$/);
    assert.equal(saved.artifact.batchId, "persona-cup");
    assert.equal(saved.artifact.enablePersonas, true);
    assert.equal(repository.listTournamentArtifacts().length, 1);
  } finally {
    cleanupTempDir(directory);
  }
});
