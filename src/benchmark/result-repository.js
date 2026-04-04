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

export class CompetitionResultRepository {
  constructor({ baseDir = path.resolve(process.cwd(), "docs/competition-results") } = {}) {
    this.baseDir = baseDir;
    mkdirSync(this.baseDir, { recursive: true });
  }

  listResults() {
    return readdirSync(this.baseDir)
      .filter((entry) => entry.endsWith(".json"))
      .sort()
      .reverse()
      .map((entry) => JSON.parse(readFileSync(path.join(this.baseDir, entry), "utf8")));
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
}
