import path from "node:path";
import { CompetitionResultRepository } from "./benchmark/result-repository.js";
import { getExperimentBatch } from "./experiments/experiment-batches.js";
import { OllamaClient } from "./experiments/ollama-client.js";
import { runPilotTournament } from "./experiments/experiment-service.js";
import { buildVirtualLeagueStandings } from "./league/virtual-league.js";
import { buildVirtualSeason } from "./league/season-service.js";

function toCompetitionShape(tournament) {
  const frameworks = tournament.summaries.builders.map((builder) => ({
    id: builder.strategyId,
    label: builder.label
  }));

  const results = tournament.buildResults.map((result) => ({
    frameworkId: result.strategyId,
    benchmarkCaseId: result.challengeId,
    resolved: result.evaluation.passedHidden === result.evaluation.totalHidden,
    durationSeconds: Math.max(1, Math.round((result.durationMs ?? 0) / 1000))
  }));

  return {
    id: tournament.id,
    createdAt: tournament.createdAt,
    benchmark: {
      name: "Synthetic Build Break Tournament",
      instanceCount: tournament.buildResults.length,
      metrics: ["resolved_rate", "mean_time_to_completion_seconds", "median_time_to_completion_seconds"]
    },
    orchestrator: "codex-5.4",
    localModelTarget: "gemma4:e4b",
    frameworks,
    results
  };
}

const batchId = process.env.EXPERIMENT_BATCH || "smoke";
const batch = getExperimentBatch(batchId);

if (!batch) {
  throw new Error(`Unknown experiment batch: ${batchId}`);
}

const personasEnabled = process.env.EXPERIMENT_PERSONAS === "1";
const leagueStyle = process.env.LEAGUE_STYLE || "icpc_sprint";
const client = new OllamaClient({
  model: process.env.OLLAMA_MODEL || "gemma4:e4b",
  baseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434",
  requestTimeoutMs: Number(process.env.OLLAMA_TIMEOUT_MS || 60000)
});
const tournament = await runPilotTournament({
  builderIds: batch.builderIds,
  attackerIds: batch.attackerIds,
  challengeIds: batch.challengeIds,
  enablePersonas: personasEnabled,
  client,
  onProgress(event) {
    console.log(JSON.stringify({ progress: event }));
  }
});
const repository = new CompetitionResultRepository({
  baseDir: path.resolve(process.cwd(), "docs/competition-results")
});
const saved = repository.saveCompetition(toCompetitionShape(tournament));
const league = buildVirtualLeagueStandings(tournament, leagueStyle);
const season = buildVirtualSeason(tournament);
let personaComparison = null;

if (process.env.EXPERIMENT_COMPARE_PERSONAS === "1") {
  const controlTournament = personasEnabled
    ? await runPilotTournament({
      builderIds: batch.builderIds,
      attackerIds: batch.attackerIds,
      challengeIds: batch.challengeIds,
      enablePersonas: false,
      client,
      onProgress(event) {
        console.log(JSON.stringify({ progress: { personaRun: "baseline", ...event } }));
      }
    })
    : tournament;
  const personaTournament = personasEnabled
    ? tournament
    : await runPilotTournament({
        builderIds: batch.builderIds,
        attackerIds: batch.attackerIds,
        challengeIds: batch.challengeIds,
        enablePersonas: true,
        client,
        onProgress(event) {
          console.log(JSON.stringify({ progress: { personaRun: "persona", ...event } }));
        }
      });
  personaComparison = {
    batchId,
    baselineOverall: controlTournament.summaries.overall,
    personaOverall: personaTournament.summaries.overall
  };
}
const savedTournament = repository.saveTournamentArtifact({
  batchId,
  tournament,
  league,
  season,
  personaComparison
});

console.log(JSON.stringify({
  batchId,
  tournamentId: tournament.id,
  savedJson: saved.jsonPath,
  savedMarkdown: saved.mdPath,
  savedTournamentJson: savedTournament.jsonPath,
  savedTournamentMarkdown: savedTournament.mdPath,
  summaries: tournament.summaries,
  swapMatches: tournament.swapResults.length,
  arenaEvents: tournament.arenaResults.length,
  league,
  season,
  personaComparison
}, null, 2));
