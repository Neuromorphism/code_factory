import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { summarizeCompetition } from "./competition-service.js";

function toSlug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildMarkdown(summary) {
  const lines = [
    `# Competition Result ${summary.id}`,
    "",
    `- Created: ${summary.createdAt}`,
    `- Benchmark: ${summary.benchmark.name}`,
    `- Orchestrator: ${summary.orchestrator}`,
    `- Local model target: ${summary.localModelTarget}`,
    "",
    "## Ranking",
    ""
  ];

  for (const entry of summary.summary ?? []) {
    lines.push(
      `- ${entry.label}: resolved rate ${entry.resolvedRate}, mean time ${entry.meanTimeToCompletionSeconds}s, median time ${entry.medianTimeToCompletionSeconds}s`
    );
  }

  lines.push("", "## Raw Summary", "", "```json", JSON.stringify(summary.summary ?? [], null, 2), "```", "");
  return lines.join("\n");
}

function buildTournamentMarkdown(artifact) {
  const lines = [
    `# Tournament Artifact ${artifact.batchId}`,
    "",
    `- Created: ${artifact.createdAt}`,
    `- Tournament: ${artifact.tournamentId}`,
    `- League style: ${artifact.league?.style?.label ?? "n/a"}`,
    `- Personas enabled: ${artifact.enablePersonas ? "yes" : "no"}`,
    `- Fix rounds enabled: ${artifact.enableFixRounds ? "yes" : "no"}`,
    "",
    "## Overall",
    ""
  ];

  for (const entry of artifact.tournamentSummary?.overall ?? []) {
    lines.push(`- ${entry.label}: composite score ${entry.compositeScore}`);
  }

  if (artifact.league?.standings?.length) {
    lines.push("", `## ${artifact.league.style.label}`, "");
    for (const entry of artifact.league.standings.slice(0, 5)) {
      lines.push(`- ${entry.team}: ${JSON.stringify(entry)}`);
    }
  }

  if (artifact.season?.overallStandings?.length) {
    lines.push("", "## Season", "");
    for (const entry of artifact.season.overallStandings.slice(0, 5)) {
      lines.push(
        `- ${entry.team}: ${entry.seasonPoints} season points, ${entry.eventWins} wins, ${entry.podiums} podiums`
      );
    }
  }

  if (artifact.personaComparison) {
    lines.push("", "## Persona Comparison", "", "```json", JSON.stringify(artifact.personaComparison, null, 2), "```");
  }

  lines.push("", "## Raw Summary", "", "```json", JSON.stringify(artifact.tournamentSummary ?? {}, null, 2), "```", "");
  return lines.join("\n");
}

export class CompetitionResultRepository {
  constructor({ baseDir = path.resolve(process.cwd(), "docs/competition-results") } = {}) {
    this.baseDir = baseDir;
    this.tournamentDir = path.join(this.baseDir, "tournaments");
    mkdirSync(this.baseDir, { recursive: true });
    mkdirSync(this.tournamentDir, { recursive: true });
  }

  listResults() {
    return readdirSync(this.baseDir)
      .filter((entry) => entry.endsWith(".json"))
      .sort()
      .reverse()
      .map((entry) => JSON.parse(readFileSync(path.join(this.baseDir, entry), "utf8")));
  }

  listTournamentArtifacts() {
    return readdirSync(this.tournamentDir)
      .filter((entry) => entry.endsWith(".json"))
      .sort()
      .reverse()
      .map((entry) => JSON.parse(readFileSync(path.join(this.tournamentDir, entry), "utf8")));
  }

  listTournamentArtifacts() {
    return readdirSync(this.tournamentDir)
      .filter((entry) => entry.endsWith(".json"))
      .sort()
      .reverse()
      .map((entry) => JSON.parse(readFileSync(path.join(this.tournamentDir, entry), "utf8")));
  }

  saveCompetition(competition) {
    const summary = summarizeCompetition(competition);
    const stem = `${summary.createdAt.slice(0, 10)}-${toSlug(summary.id)}`;
    const jsonPath = path.join(this.baseDir, `${stem}.json`);
    const mdPath = path.join(this.baseDir, `${stem}.md`);

    writeFileSync(jsonPath, JSON.stringify(summary, null, 2));
    writeFileSync(mdPath, buildMarkdown(summary));

    return {
      summary,
      jsonPath,
      mdPath
    };
  }

  saveTournamentArtifact({
    batchId,
    tournament,
    league,
    season,
    personaComparison = null
  }) {
    const payload = {
      kind: "tournament_artifact",
      batchId,
      createdAt: tournament.completedAt ?? tournament.createdAt,
      tournamentId: tournament.id,
      enablePersonas: tournament.enablePersonas,
      enableFixRounds: tournament.enableFixRounds,
      tournamentSummary: tournament.summaries,
      league,
      season,
      personaComparison
    };
    const stem = `${payload.createdAt.slice(0, 10)}-${toSlug(batchId)}-${toSlug(tournament.id)}`;
    const jsonPath = path.join(this.tournamentDir, `${stem}.json`);
    const mdPath = path.join(this.tournamentDir, `${stem}.md`);

    writeFileSync(jsonPath, JSON.stringify(payload, null, 2));
    writeFileSync(mdPath, buildTournamentMarkdown(payload));

    return {
      artifact: payload,
      jsonPath,
      mdPath
    };
  }
}
