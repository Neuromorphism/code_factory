import { loadCandidateFunction } from "./code-evaluator.js";

function normalizeMove(rawMove) {
  const numeric = Number(rawMove);
  return Number.isInteger(numeric) ? numeric : null;
}

async function playTokenMatch(first, second, startingTokens, maxTake) {
  let tokensRemaining = startingTokens;
  const players = [first, second];
  let turn = 0;

  while (tokensRemaining > 0 && turn < 100) {
    const active = players[turn % 2];
    const opponent = players[(turn + 1) % 2];
    let requestedMove;

    try {
      requestedMove = await active.fn({
        tokensRemaining,
        maxTake
      });
    } catch (error) {
      return {
        winnerStrategyId: opponent.strategyId,
        loserStrategyId: active.strategyId,
        reason: `runtime_error:${error.message}`
      };
    }

    const move = normalizeMove(requestedMove);
    const legalMax = Math.max(1, Math.min(maxTake, tokensRemaining));

    if (move === null || move < 1 || move > legalMax) {
      return {
        winnerStrategyId: opponent.strategyId,
        loserStrategyId: active.strategyId,
        reason: "illegal_move"
      };
    }

    tokensRemaining -= move;
    if (tokensRemaining === 0) {
      return {
        winnerStrategyId: active.strategyId,
        loserStrategyId: opponent.strategyId,
        reason: "took_last_token"
      };
    }

    turn += 1;
  }

  return {
    winnerStrategyId: second.strategyId,
    loserStrategyId: first.strategyId,
    reason: "turn_limit"
  };
}

function createStanding(buildResult) {
  return {
    strategyId: buildResult.strategyId,
    label: buildResult.strategyLabel,
    wins: 0,
    losses: 0,
    invalidLosses: 0,
    matchPoints: 0
  };
}

export async function runArenaRoundRobin(challenge, buildResults) {
  if (!challenge.arena || challenge.arena.type !== "take_tokens") {
    return null;
  }

  const loadedTeams = [];

  for (const result of buildResults) {
    try {
      const loaded = await loadCandidateFunction(challenge, result.code);
      loadedTeams.push({
        strategyId: result.strategyId,
        strategyLabel: result.strategyLabel,
        fn: loaded.fn,
        cleanup: loaded.cleanup
      });
    } catch {
      loadedTeams.push({
        strategyId: result.strategyId,
        strategyLabel: result.strategyLabel,
        fn: null,
        cleanup() {}
      });
    }
  }

  const standings = new Map(buildResults.map((result) => [result.strategyId, createStanding(result)]));
  const matches = [];

  try {
    for (const startingTokens of challenge.arena.startingTokens || []) {
      for (let index = 0; index < loadedTeams.length; index += 1) {
        for (let compare = index + 1; compare < loadedTeams.length; compare += 1) {
          const pairings = [
            [loadedTeams[index], loadedTeams[compare]],
            [loadedTeams[compare], loadedTeams[index]]
          ];

          for (const [first, second] of pairings) {
            let outcome;

            if (!first.fn || !second.fn) {
              const winner = first.fn ? first : second;
              const loser = first.fn ? second : first;
              outcome = {
                winnerStrategyId: winner.strategyId,
                loserStrategyId: loser.strategyId,
                reason: "compile_forfeit"
              };
            } else {
              outcome = await playTokenMatch(first, second, startingTokens, challenge.arena.maxTake || 3);
            }

            const winner = standings.get(outcome.winnerStrategyId);
            const loser = standings.get(outcome.loserStrategyId);
            winner.wins += 1;
            winner.matchPoints += 3;
            loser.losses += 1;
            if (outcome.reason === "illegal_move" || outcome.reason === "compile_forfeit") {
              loser.invalidLosses += 1;
            }

            matches.push({
              challengeId: challenge.id,
              startingTokens,
              homeStrategyId: first.strategyId,
              awayStrategyId: second.strategyId,
              winnerStrategyId: outcome.winnerStrategyId,
              loserStrategyId: outcome.loserStrategyId,
              reason: outcome.reason
            });
          }
        }
      }
    }
  } finally {
    for (const team of loadedTeams) {
      team.cleanup();
    }
  }

  return {
    challengeId: challenge.id,
    arenaType: challenge.arena.type,
    matches,
    standings: [...standings.values()].sort((left, right) => {
      if (right.matchPoints !== left.matchPoints) {
        return right.matchPoints - left.matchPoints;
      }
      if (right.wins !== left.wins) {
        return right.wins - left.wins;
      }
      if (left.invalidLosses !== right.invalidLosses) {
        return left.invalidLosses - right.invalidLosses;
      }
      return left.label.localeCompare(right.label);
    })
  };
}
