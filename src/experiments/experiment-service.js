import { makeId, nowIso } from "../utils.js";
import { getChallenge, listChallenges } from "./challenge-catalog.js";
import { OllamaClient } from "./ollama-client.js";
import { getTeamStrategy, listStrategiesByMode, listTeamStrategies } from "./team-strategies.js";
import { runAttackWithAnyStrategy, runFixStrategy, runStrategy } from "./team-runner.js";
import { assignProfile } from "../league/team-profiles.js";
import { runArenaRoundRobin } from "./arena-service.js";

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function caseKey(entry) {
  return JSON.stringify({
    target: entry?.target ?? null,
    args: entry?.args ?? []
  });
}

function dedupeSuccessfulCases(entries) {
  const seen = new Set();
  const output = [];

  for (const entry of entries) {
    const key = caseKey(entry);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(entry);
  }

  return output;
}

function representedStrategies(results, mode) {
  if (!results.length) {
    return [];
  }

  const seen = new Map();

  for (const result of results) {
    if (result.kind && mode === "build" && result.kind !== "build" && result.kind !== "fix") {
      continue;
    }

    if (result.kind && (mode === "break" || mode === "test") && result.kind !== "attack") {
      continue;
    }

    seen.set(result.strategyId, result.strategyLabel);
  }

  const fallback = listStrategiesByMode(mode).filter((strategy) => seen.has(strategy.id));
  return fallback.length
    ? fallback
    : listStrategiesByMode(mode);
}

export function createExperimentTemplate() {
  return {
    id: makeId("experiment"),
    createdAt: nowIso(),
    modelRuntime: {
      provider: "ollama",
      model: "gemma4:e4b",
      baseUrl: "http://127.0.0.1:11434"
    },
    tasks: {
      build: listChallenges().map((challenge) => challenge.id),
      break: listChallenges().filter((challenge) => challenge.directCompetition).map((challenge) => challenge.id),
      test: listChallenges().filter((challenge) => challenge.directCompetition).map((challenge) => challenge.id),
      fix: listChallenges().filter((challenge) => challenge.directCompetition).map((challenge) => challenge.id)
    },
    strategies: listTeamStrategies(),
    personaMode: "optional",
    fixRounds: "optional"
  };
}

export async function runPilotTournament({
  builderIds = ["solo_builder", "pipeline_five_stage", "red_blue_builder", "repair_loop_builder"],
  attackerIds = ["breaker_solo", "fuzz_breaker", "qa_fuzzer", "mutation_breaker"],
  challengeIds = ["normalize-tags", "settle-ledger", "rank-players"],
  client = new OllamaClient(),
  enablePersonas = false,
  enableFixRounds = true,
  onProgress = null
} = {}) {
  const startedAt = nowIso();
  const buildResults = [];
  const attackResults = [];
  const swapResults = [];
  const fixResults = [];
  const arenaResults = [];

  for (const builderId of builderIds) {
    const strategy = getTeamStrategy(builderId);
    const builderProfile = enablePersonas ? assignProfile(builderId, builderIds.indexOf(builderId)) : null;

    for (const challengeId of challengeIds) {
      const challenge = getChallenge(challengeId);
      onProgress?.({
        stage: "build",
        strategyId: builderId,
        challengeId
      });
      const buildResult = await runStrategy(strategy, challenge, client, {
        teamProfile: builderProfile
      });
      buildResults.push(buildResult);

      for (const attackerId of attackerIds) {
        const attackerStrategy = getTeamStrategy(attackerId);
        const attackerProfile = enablePersonas
          ? assignProfile(attackerId, attackerIds.indexOf(attackerId) + builderIds.length)
          : null;
        onProgress?.({
          stage: "attack",
          strategyId: attackerId,
          targetStrategyId: builderId,
          challengeId
        });
        const attackResult = await runStrategy(attackerStrategy, challenge, client, {
          targetCode: buildResult.code,
          teamProfile: attackerProfile
        });
        attackResults.push({
          ...attackResult,
          targetStrategyId: builderId,
          targetStrategyLabel: strategy.label
        });
      }
    }
  }

  for (const challengeId of challengeIds) {
    const challenge = getChallenge(challengeId);
    const challengeBuilds = buildResults.filter((result) => result.challengeId === challengeId);

    for (const attacker of challengeBuilds) {
      for (const defender of challengeBuilds) {
        if (attacker.strategyId === defender.strategyId) {
          continue;
        }

        const attackerStrategy = getTeamStrategy(attacker.strategyId);
        onProgress?.({
          stage: "swap",
          strategyId: attacker.strategyId,
          targetStrategyId: defender.strategyId,
          challengeId
        });
        const swapAttack = await runAttackWithAnyStrategy(attackerStrategy, challenge, client, {
          targetCode: defender.code,
          teamProfile: attacker.teamProfile
        });
        swapResults.push({
          ...swapAttack,
          attackerStrategyId: attacker.strategyId,
          attackerStrategyLabel: attacker.strategyLabel,
          targetStrategyId: defender.strategyId,
          targetStrategyLabel: defender.strategyLabel
        });
      }
    }
  }

  for (const challengeId of challengeIds) {
    const challenge = getChallenge(challengeId);
    if (!challenge?.arena) {
      continue;
    }

    const challengeBuilds = buildResults.filter((result) => result.challengeId === challengeId);
    if (challengeBuilds.length < 2) {
      continue;
    }

    const arenaResult = await runArenaRoundRobin(challenge, challengeBuilds);
    if (arenaResult) {
      onProgress?.({
        stage: "arena",
        challengeId
      });
      arenaResults.push(arenaResult);
    }
  }

  if (enableFixRounds) {
    for (const buildResult of buildResults) {
      const challenge = getChallenge(buildResult.challengeId);
      const successfulCases = dedupeSuccessfulCases(
        attackResults
          .filter(
            (result) =>
              result.challengeId === buildResult.challengeId && result.targetStrategyId === buildResult.strategyId
          )
          .flatMap((result) => result.score.successfulCases)
          .concat(
            swapResults
              .filter(
                (result) =>
                  result.challengeId === buildResult.challengeId &&
                  result.targetStrategyId === buildResult.strategyId
              )
              .flatMap((result) => result.score.successfulCases)
          )
      );

      if (!successfulCases.length) {
        continue;
      }

      const builderStrategy = getTeamStrategy(buildResult.strategyId);
      onProgress?.({
        stage: "fix",
        strategyId: buildResult.strategyId,
        challengeId: buildResult.challengeId
      });
      const fixResult = await runFixStrategy(builderStrategy, challenge, client, {
        currentCode: buildResult.code,
        successfulCases,
        teamProfile: buildResult.teamProfile
      });

      fixResults.push(fixResult);
    }
  }

  const summaries = summarizeTournament(buildResults, attackResults, swapResults, fixResults, arenaResults);

  return {
    id: makeId("tournament"),
    createdAt: startedAt,
    completedAt: nowIso(),
    enablePersonas,
    enableFixRounds,
    buildResults,
    attackResults,
    swapResults,
    fixResults,
    arenaResults,
    summaries
  };
}

function summarizeTournament(buildResults, attackResults, swapResults, fixResults, arenaResults) {
  const builderSummary = representedStrategies(buildResults, "build").map((strategy) => {
    const results = buildResults.filter((result) => result.strategyId === strategy.id);
    return {
      strategyId: strategy.id,
      label: strategy.label,
      tasks: results.length,
      totalBuildScore: sum(results.map((result) => result.score)),
      hiddenPasses: sum(results.map((result) => result.evaluation.passedHidden)),
      visiblePasses: sum(results.map((result) => result.evaluation.passedVisible)),
      totalDurationMs: sum(results.map((result) => result.durationMs ?? 0))
    };
  });

  const breakerSummary = representedStrategies(attackResults, "break")
    .concat(representedStrategies(attackResults, "test"))
    .map((strategy) => {
      const results = attackResults.filter((result) => result.strategyId === strategy.id);
      return {
        strategyId: strategy.id,
        label: strategy.label,
        attempts: results.length,
        successfulBreaks: sum(results.map((result) => result.successfulBreaks)),
        family: strategy.family,
        totalDurationMs: sum(results.map((result) => result.durationMs ?? 0))
      };
    });

  const defenseSummary = representedStrategies(buildResults, "build").map((strategy) => {
    const results = attackResults.filter((result) => result.targetStrategyId === strategy.id);
    const swapAttacks = swapResults.filter((result) => result.targetStrategyId === strategy.id);
    const fixes = fixResults.filter((result) => result.strategyId === strategy.id);
    return {
      strategyId: strategy.id,
      label: strategy.label,
      attacksFaced: results.length + swapAttacks.length,
      successfulBreaksAgainstIt:
        sum(results.map((result) => result.successfulBreaks)) +
        sum(swapAttacks.map((result) => result.successfulBreaks)),
      recoveredBreaks: sum(fixes.map((result) => result.recoveredCases)),
      remainingBreaksAfterFix: sum(fixes.map((result) => result.remainingCases))
    };
  });

  const swapAttackSummary = representedStrategies(buildResults, "build").map((strategy) => {
    const results = swapResults.filter((result) => result.attackerStrategyId === strategy.id);
    return {
      strategyId: strategy.id,
      label: strategy.label,
      swapMatches: results.length,
      successfulBreaks: sum(results.map((result) => result.successfulBreaks))
    };
  });

  const fixSummary = representedStrategies(fixResults, "build").map((strategy) => {
    const results = fixResults.filter((result) => result.strategyId === strategy.id);
    return {
      strategyId: strategy.id,
      label: strategy.label,
      rounds: results.length,
      confirmedFailures: sum(results.map((result) => result.confirmedFailures)),
      recoveredBreaks: sum(results.map((result) => result.recoveredCases)),
      remainingBreaks: sum(results.map((result) => result.remainingCases)),
      retainedHiddenPasses: sum(results.map((result) => result.evaluation.passedHidden))
    };
  });

  const arenaSummary = representedStrategies(buildResults, "build").map((strategy) => {
    const results = arenaResults.flatMap((arena) => arena.standings.filter((entry) => entry.strategyId === strategy.id));
    return {
      strategyId: strategy.id,
      label: strategy.label,
      arenaEvents: results.length,
      arenaPoints: sum(results.map((result) => result.matchPoints)),
      arenaWins: sum(results.map((result) => result.wins)),
      arenaLosses: sum(results.map((result) => result.losses))
    };
  });

  const overallSummary = representedStrategies(buildResults, "build").map((strategy) => {
    const build = builderSummary.find((entry) => entry.strategyId === strategy.id);
    const defense = defenseSummary.find((entry) => entry.strategyId === strategy.id);
    const fixes = fixSummary.find((entry) => entry.strategyId === strategy.id);
    const swap = swapAttackSummary.find((entry) => entry.strategyId === strategy.id);
    const arena = arenaSummary.find((entry) => entry.strategyId === strategy.id);

    return {
      strategyId: strategy.id,
      label: strategy.label,
      compositeScore:
        (build?.totalBuildScore ?? 0) +
        (arena?.arenaPoints ?? 0) +
        (swap?.successfulBreaks ?? 0) * 8 +
        (fixes?.recoveredBreaks ?? 0) * 5 -
        (defense?.remainingBreaksAfterFix ?? defense?.successfulBreaksAgainstIt ?? 0) * 3
    };
  });

  return {
    builders: builderSummary.sort((left, right) => right.totalBuildScore - left.totalBuildScore),
    breakers: breakerSummary.sort((left, right) => right.successfulBreaks - left.successfulBreaks),
    defenses: defenseSummary.sort((left, right) => left.successfulBreaksAgainstIt - right.successfulBreaksAgainstIt),
    swapAttackers: swapAttackSummary.sort((left, right) => right.successfulBreaks - left.successfulBreaks),
    fixers: fixSummary.sort((left, right) => right.recoveredBreaks - left.recoveredBreaks),
    arenas: arenaSummary.sort((left, right) => right.arenaPoints - left.arenaPoints),
    overall: overallSummary.sort((left, right) => right.compositeScore - left.compositeScore)
  };
}
