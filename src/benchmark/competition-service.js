import { average, makeId, nowIso } from "../utils.js";
import { listFrameworkCatalog } from "./framework-catalog.js";
import { recommendLocalModelPlan } from "./local-model-plan.js";

function median(values) {
  if (!values.length) {
    return 0;
  }

  const ordered = [...values].sort((left, right) => left - right);
  const center = Math.floor(ordered.length / 2);

  if (ordered.length % 2 === 1) {
    return ordered[center];
  }

  return Math.round((ordered[center - 1] + ordered[center]) / 2);
}

export function createCompetitionSpec({
  benchmarkName = "SWE-bench Lite",
  instanceCount = 10,
  orchestrator = "codex-5.4",
  localModelTarget = "gemma4:e4b",
  machineProfile = {}
} = {}) {
  return {
    id: makeId("competition"),
    createdAt: nowIso(),
    status: "draft",
    benchmark: {
      name: benchmarkName,
      instanceCount,
      metrics: ["resolved_rate", "mean_time_to_completion_seconds", "median_time_to_completion_seconds"]
    },
    orchestrator,
    localModelTarget,
    localModelPlan: recommendLocalModelPlan(machineProfile),
    frameworks: listFrameworkCatalog().map((framework) => ({
      ...framework,
      status: "planned"
    })),
    results: []
  };
}

export function recordCompetitionResult(competition, result) {
  return {
    ...competition,
    results: [...competition.results, result]
  };
}

export function summarizeCompetition(competition) {
  const frameworks = competition.frameworks.map((framework) => {
    const results = competition.results.filter((result) => result.frameworkId === framework.id);
    const durations = results.map((result) => result.durationSeconds);
    const resolved = results.filter((result) => result.resolved).length;

    return {
      frameworkId: framework.id,
      label: framework.label,
      attempts: results.length,
      resolved,
      resolvedRate: results.length ? Number((resolved / results.length).toFixed(3)) : 0,
      meanTimeToCompletionSeconds: average(durations),
      medianTimeToCompletionSeconds: median(durations)
    };
  });

  return {
    ...competition,
    summary: frameworks
      .slice()
      .sort((left, right) => {
        if (right.resolvedRate !== left.resolvedRate) {
          return right.resolvedRate - left.resolvedRate;
        }

        return left.meanTimeToCompletionSeconds - right.meanTimeToCompletionSeconds;
      })
  };
}
