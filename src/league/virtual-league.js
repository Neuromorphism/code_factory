import { makeId, nowIso } from "../utils.js";
import { getCompetitionStyle } from "./competition-styles.js";

function durationSeconds(entry) {
  return Math.round((entry.durationMs ?? 0) / 1000);
}

function baseTeamMap(tournament) {
  const seen = new Map();

  for (const result of tournament.buildResults || []) {
    if (!seen.has(result.strategyId)) {
      seen.set(result.strategyId, {
        strategyId: result.strategyId,
        team: result.strategyLabel,
        buildScore: 0,
        provisionalScore: 0,
        solved: 0,
        fullyCorrect: 0,
        penaltyMinutes: 0,
        totalTimeSeconds: 0,
        challengeBreaks: 0,
        incomingBreaks: 0,
        recoveredBreaks: 0,
        remainingBreaks: 0,
        arenaPoints: 0,
        arenaWins: 0,
        arenaLosses: 0
      });
    }
  }

  return seen;
}

function aggregateMetrics(tournament) {
  const teams = baseTeamMap(tournament);

  for (const result of tournament.buildResults || []) {
    const team = teams.get(result.strategyId);
    const solvedHidden = result.evaluation.passedHidden === result.evaluation.totalHidden;
    const wrongAttempts = result.evaluation.hiddenFailures.length + result.evaluation.visibleFailures.length;
    team.buildScore += result.score;
    team.provisionalScore += result.evaluation.passedVisible;
    team.totalTimeSeconds += durationSeconds(result);
    team.penaltyMinutes += Math.ceil(durationSeconds(result) / 60) + wrongAttempts * 20;
    team.solved += solvedHidden ? 1 : 0;
    team.fullyCorrect += solvedHidden ? 1 : 0;
  }

  for (const result of tournament.attackResults || []) {
    const team = teams.get(result.targetStrategyId);
    if (team) {
      team.incomingBreaks += result.successfulBreaks;
    }
  }

  for (const result of tournament.swapResults || []) {
    const attacker = teams.get(result.attackerStrategyId);
    const defender = teams.get(result.targetStrategyId);
    if (attacker) {
      attacker.challengeBreaks += result.successfulBreaks;
    }
    if (defender) {
      defender.incomingBreaks += result.successfulBreaks;
    }
  }

  for (const result of tournament.fixResults || []) {
    const team = teams.get(result.strategyId);
    if (team) {
      team.recoveredBreaks += result.recoveredCases;
      team.remainingBreaks += result.remainingCases;
    }
  }

  for (const arena of tournament.arenaResults || []) {
    for (const standing of arena.standings || []) {
      const team = teams.get(standing.strategyId);
      if (!team) {
        continue;
      }
      team.arenaPoints += standing.matchPoints;
      team.arenaWins += standing.wins;
      team.arenaLosses += standing.losses;
    }
  }

  return [...teams.values()];
}

function summarizeIcpc(tournament) {
  return aggregateMetrics(tournament)
    .map((team) => ({
      team: team.team,
      solved: team.solved,
      penaltyMinutes: team.penaltyMinutes
    }))
    .sort((left, right) => {
      if (right.solved !== left.solved) {
        return right.solved - left.solved;
      }
      return left.penaltyMinutes - right.penaltyMinutes;
    });
}

function summarizeMarathon(tournament) {
  return aggregateMetrics(tournament)
    .map((team) => ({
      team: team.team,
      provisionalScore: team.provisionalScore,
      finalScore: team.buildScore
    }))
    .sort((left, right) => right.finalScore - left.finalScore);
}

function summarizeSrm(tournament) {
  return aggregateMetrics(tournament)
    .map((team) => ({
      team: team.team,
      buildScore: team.buildScore,
      challengePoints: team.challengeBreaks * 10,
      totalScore: team.buildScore + team.challengeBreaks * 10
    }))
    .sort((left, right) => right.totalScore - left.totalScore);
}

function summarizeHackerCup(tournament) {
  return aggregateMetrics(tournament)
    .map((team) => ({
      team: team.team,
      fullyCorrect: team.fullyCorrect,
      totalTimeSeconds: team.totalTimeSeconds
    }))
    .sort((left, right) => {
      if (right.fullyCorrect !== left.fullyCorrect) {
        return right.fullyCorrect - left.fullyCorrect;
      }
      return left.totalTimeSeconds - right.totalTimeSeconds;
    });
}

function summarizeBibifi(tournament, style) {
  const weights = style.scoring;
  return aggregateMetrics(tournament)
    .map((team) => ({
      team: team.team,
      shipScore: team.buildScore * weights.shipWeight,
      breakBonus: team.challengeBreaks * weights.breakWeight,
      fixRecovery: team.recoveredBreaks * weights.fixRecoveryWeight,
      unresolvedPenalty: team.remainingBreaks * weights.unresolvedBreakPenalty,
      totalScore:
        team.buildScore * weights.shipWeight +
        team.challengeBreaks * weights.breakWeight +
        team.recoveredBreaks * weights.fixRecoveryWeight -
        team.remainingBreaks * weights.unresolvedBreakPenalty
    }))
    .sort((left, right) => right.totalScore - left.totalScore);
}

function summarizeAixcc(tournament, style) {
  const weights = style.scoring;
  return aggregateMetrics(tournament)
    .map((team) => ({
      team: team.team,
      availabilityScore: team.buildScore * weights.availabilityWeight,
      patchScore: team.recoveredBreaks * weights.patchWeight,
      breakScore: team.challengeBreaks * weights.breakWeight,
      arenaScore: team.arenaPoints,
      totalScore:
        team.buildScore * weights.availabilityWeight +
        team.recoveredBreaks * weights.patchWeight +
        team.challengeBreaks * weights.breakWeight +
        team.arenaPoints -
        team.remainingBreaks * 2
    }))
    .sort((left, right) => right.totalScore - left.totalScore);
}

function buildHighlights(tournament) {
  const metrics = aggregateMetrics(tournament);
  const by = (selector) => [...metrics].sort((left, right) => selector(right) - selector(left))[0];
  const safest = [...metrics].sort((left, right) => left.incomingBreaks - right.incomingBreaks)[0];

  return [
    by((team) => team.buildScore)
      ? `Top builder: ${by((team) => team.buildScore).team} with build score ${by((team) => team.buildScore).buildScore}.`
      : null,
    by((team) => team.challengeBreaks)
      ? `Best challenger: ${by((team) => team.challengeBreaks).team} with ${by((team) => team.challengeBreaks).challengeBreaks} successful swap breaks.`
      : null,
    safest
      ? `Toughest defense: ${safest.team} allowed ${safest.incomingBreaks} successful breaks before fix recovery.`
      : null,
    by((team) => team.arenaPoints)
      ? `Arena leader: ${by((team) => team.arenaPoints).team} earned ${by((team) => team.arenaPoints).arenaPoints} arena points.`
      : null
  ].filter(Boolean);
}

export function buildVirtualLeagueStandings(tournament, styleId = "icpc_sprint") {
  const style = getCompetitionStyle(styleId);
  let standings;

  switch (styleId) {
    case "topcoder_marathon":
      standings = summarizeMarathon(tournament);
      break;
    case "srm_challenge":
      standings = summarizeSrm(tournament);
      break;
    case "hacker_cup_round":
      standings = summarizeHackerCup(tournament);
      break;
    case "bibifi_showdown":
      standings = summarizeBibifi(tournament, style);
      break;
    case "aixcc_patch_race":
      standings = summarizeAixcc(tournament, style);
      break;
    case "icpc_sprint":
    default:
      standings = summarizeIcpc(tournament);
      break;
  }

  return {
    id: makeId("league"),
    createdAt: nowIso(),
    style,
    standings,
    highlights: buildHighlights(tournament)
  };
}
