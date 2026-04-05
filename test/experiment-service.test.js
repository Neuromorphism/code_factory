import test from "node:test";
import assert from "node:assert/strict";
import { createExperimentTemplate, runPilotTournament } from "../src/experiments/experiment-service.js";

class StubClient {
  async generate(prompt) {
    if (prompt.includes("Generate concise adversarial test cases")) {
      return {
        summary: "attack",
        cases: [
          {
            args: [[{ account: "A", amount: -4 }, { account: "A", amount: 1 }]],
            why: "negative clamp"
          }
        ]
      };
    }

    if (prompt.includes("function named chooseMove")) {
      return {
        summary: "implemented",
        code: `
function chooseMove(state) {
  const maxTake = state.maxTake || 3;
  const remainder = state.tokensRemaining % (maxTake + 1);
  return remainder === 0 ? 1 : remainder;
}
        `
      };
    }

    if (prompt.includes("function named normalizeTags")) {
      return {
        summary: "implemented",
        code: `
function normalizeTags(input) {
  const seen = new Set();
  const output = [];
  for (const value of Array.isArray(input) ? input : []) {
    if (typeof value !== "string") continue;
    const normalized = value.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    output.push(normalized);
  }
  return output;
}
        `
      };
    }

    if (prompt.includes("function named settleLedger")) {
      return {
        summary: "implemented",
        code: `
function settleLedger(entries) {
  const balances = {};
  for (const entry of Array.isArray(entries) ? entries : []) {
    if (!entry || typeof entry.account !== "string" || typeof entry.amount !== "number") continue;
    const account = entry.account.trim().toLowerCase();
    if (!account) continue;
    balances[account] = (balances[account] || 0) + entry.amount;
    if (balances[account] < 0) balances[account] = 0;
  }
  return balances;
}
        `
      };
    }

    if (prompt.includes("Current implementation")) {
      return {
        summary: "review",
        tests: ["try duplicate inputs"],
        issues: ["watch tie breakers"],
        attacks: ["negative balances"],
        decision: "approve"
      };
    }

    return {
      summary: "plan",
      design: "simple",
      milestones: ["implement", "check edge cases"],
      risks: ["duplicates"],
      edgeCases: ["duplicates"]
    };
  }
}

class FaultyAttackClient extends StubClient {
  async generate(prompt) {
    if (prompt.includes("Generate concise adversarial test cases")) {
      throw new Error("malformed json");
    }

    return super.generate(prompt);
  }
}

class FixRoundClient extends StubClient {
  async generate(prompt) {
    if (prompt.includes("Generate concise adversarial test cases")) {
      return {
        summary: "attack",
        cases: [
          {
            args: [[{ account: "A", amount: -4 }, { account: "A", amount: 1 }]],
            why: "missing clamp"
          }
        ]
      };
    }

    if (prompt.includes("Confirmed failing cases") && prompt.includes("function named settleLedger")) {
      return {
        summary: "fixed",
        code: `
function settleLedger(entries) {
  const balances = {};
  for (const entry of Array.isArray(entries) ? entries : []) {
    if (!entry || typeof entry.account !== "string" || typeof entry.amount !== "number") continue;
    const account = entry.account.trim().toLowerCase();
    if (!account) continue;
    balances[account] = (balances[account] || 0) + entry.amount;
    if (balances[account] < 0) balances[account] = 0;
  }
  return balances;
}
        `
      };
    }

    if (prompt.includes("function named settleLedger")) {
      return {
        summary: "buggy build",
        code: `
function settleLedger(entries) {
  const balances = {};
  for (const entry of Array.isArray(entries) ? entries : []) {
    if (!entry || typeof entry.account !== "string" || typeof entry.amount !== "number") continue;
    const account = entry.account.trim().toLowerCase();
    if (!account) continue;
    balances[account] = (balances[account] || 0) + entry.amount;
  }
  return balances;
}
        `
      };
    }

    return super.generate(prompt);
  }
}

class ParallelSystemClient extends StubClient {
  async generate(prompt) {
    if (prompt.includes("Write only the JavaScript module body.") && prompt.includes("Ops Console Core")) {
      if (prompt.includes("You are the Integrator")) {
        throw new Error("integrator timeout");
      }

      return {
        summary: "system module",
        code: `
function normalizeTags(input) {
  const seen = new Set();
  const output = [];
  for (const value of Array.isArray(input) ? input : []) {
    if (typeof value !== "string") continue;
    const normalized = value.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    output.push(normalized);
  }
  return output;
}

function settleLedger(entries) {
  const balances = {};
  for (const entry of Array.isArray(entries) ? entries : []) {
    if (!entry || typeof entry.account !== "string" || typeof entry.amount !== "number") continue;
    const account = entry.account.trim().toLowerCase();
    if (!account) continue;
    balances[account] = (balances[account] || 0) + entry.amount;
    if (balances[account] < 0) balances[account] = 0;
  }
  return balances;
}

function rankPlayers(rounds) {
  const totals = new Map();
  for (const round of Array.isArray(rounds) ? rounds : []) {
    if (!round || typeof round.player !== "string" || typeof round.points !== "number") continue;
    const current = totals.get(round.player) || { player: round.player, points: 0, wins: 0 };
    current.points += round.points;
    if (round.won === true) current.wins += 1;
    totals.set(round.player, current);
  }
  return [...totals.values()].sort((left, right) => {
    if (right.points !== left.points) return right.points - left.points;
    if (right.wins !== left.wins) return right.wins - left.wins;
    return left.player.localeCompare(right.player);
  });
}

function buildDashboardSummary(payload) {
  const tags = normalizeTags(payload?.tags);
  const balances = settleLedger(payload?.entries);
  const leaderboard = rankPlayers(payload?.rounds);
  const positiveBalanceTotal = Object.values(balances).reduce((total, value) => total + value, 0);

  return {
    tags,
    balances,
    leaderboard,
    status: {
      uniqueTags: tags.length,
      activeAccounts: Object.keys(balances).length,
      topPlayer: leaderboard[0]?.player ?? null,
      positiveBalanceTotal
    }
  };
}
        `
      };
    }

    if (prompt.includes("Target export: normalizeTags.")) {
      return {
        summary: "tags fragment",
        target: "normalizeTags",
        code: `
function normalizeTags(input) {
  const seen = new Set();
  const output = [];
  for (const value of Array.isArray(input) ? input : []) {
    if (typeof value !== "string") continue;
    const normalized = value.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    output.push(normalized);
  }
  return output;
}
        `
      };
    }

    if (prompt.includes("Target export: settleLedger.")) {
      return {
        summary: "ledger fragment",
        target: "settleLedger",
        code: `
function settleLedger(entries) {
  const balances = {};
  for (const entry of Array.isArray(entries) ? entries : []) {
    if (!entry || typeof entry.account !== "string" || typeof entry.amount !== "number") continue;
    const account = entry.account.trim().toLowerCase();
    if (!account) continue;
    balances[account] = (balances[account] || 0) + entry.amount;
    if (balances[account] < 0) balances[account] = 0;
  }
  return balances;
}
        `
      };
    }

    if (prompt.includes("Target export: rankPlayers.")) {
      return {
        summary: "ranking fragment",
        target: "rankPlayers",
        code: `
function rankPlayers(rounds) {
  const totals = new Map();
  for (const round of Array.isArray(rounds) ? rounds : []) {
    if (!round || typeof round.player !== "string" || typeof round.points !== "number") continue;
    const current = totals.get(round.player) || { player: round.player, points: 0, wins: 0 };
    current.points += round.points;
    if (round.won === true) current.wins += 1;
    totals.set(round.player, current);
  }
  return [...totals.values()].sort((left, right) => {
    if (right.points !== left.points) return right.points - left.points;
    if (right.wins !== left.wins) return right.wins - left.wins;
    return left.player.localeCompare(right.player);
  });
}
        `
      };
    }

    if (prompt.includes("Target export: buildDashboardSummary.")) {
      return {
        summary: "summary fragment",
        target: "buildDashboardSummary",
        code: `
function buildDashboardSummary(payload) {
  const tags = normalizeTags(payload?.tags);
  const balances = settleLedger(payload?.entries);
  const leaderboard = rankPlayers(payload?.rounds);
  const positiveBalanceTotal = Object.values(balances).reduce((total, value) => total + value, 0);

  return {
    tags,
    balances,
    leaderboard,
    status: {
      uniqueTags: tags.length,
      activeAccounts: Object.keys(balances).length,
      topPlayer: leaderboard[0]?.player ?? null,
      positiveBalanceTotal
    }
  };
}
        `
      };
    }

    if (prompt.includes("Generate concise adversarial test cases")) {
      return {
        summary: "attack",
        cases: [
          {
            target: "buildDashboardSummary",
            args: [{
              tags: [" Alpha ", "ALPHA"],
              entries: [{ account: "A", amount: 5 }, { account: " a ", amount: -2 }],
              rounds: [{ player: "Ada", points: 3, won: true }]
            }],
            why: "module teams should preserve nested summary integrity"
          }
        ]
      };
    }

    return super.generate(prompt);
  }
}

class MisroutedFragmentClient extends ParallelSystemClient {
  async generate(prompt) {
    const result = await super.generate(prompt);
    if (result?.target && prompt.includes("Target export:")) {
      return {
        ...result,
        target: "settleLedger"
      };
    }

    return result;
  }
}

test("experiment template exposes runtime, challenges, and strategies", () => {
  const template = createExperimentTemplate();
  assert.equal(template.modelRuntime.model, "gemma4:e4b");
  assert.ok(template.tasks.build.includes("token-duel"));
  assert.ok(template.tasks.build.includes("ops-console-core"));
  assert.ok(template.tasks.fix.length >= 2);
  assert.ok(template.strategies.length >= 20);
});

test("pilot tournament ranks builder and breaker strategies", async () => {
  const tournament = await runPilotTournament({
    builderIds: ["solo_builder"],
    attackerIds: ["breaker_solo"],
    challengeIds: ["normalize-tags", "settle-ledger"],
    client: new StubClient()
  });

  assert.equal(tournament.buildResults.length, 2);
  assert.equal(tournament.attackResults.length, 2);
  assert.equal(tournament.swapResults.length, 0);
  assert.equal(tournament.fixResults.length, 0);
  assert.equal(tournament.summaries.builders[0].strategyId, "solo_builder");
  assert.equal(tournament.summaries.breakers[0].strategyId, "breaker_solo");
});

test("pilot tournament runs swap attacks when multiple builder teams are present", async () => {
  const tournament = await runPilotTournament({
    builderIds: ["solo_builder", "pipeline_five_stage"],
    attackerIds: [],
    challengeIds: ["normalize-tags"],
    client: new StubClient()
  });

  assert.equal(tournament.buildResults.length, 2);
  assert.equal(tournament.swapResults.length, 2);
  assert.equal(tournament.summaries.swapAttackers.length >= 2, true);
});

test("pilot tournament records arena standings for direct competition challenges", async () => {
  const tournament = await runPilotTournament({
    builderIds: ["solo_builder", "pipeline_five_stage"],
    attackerIds: [],
    challengeIds: ["token-duel"],
    client: new StubClient(),
    enableFixRounds: false
  });

  assert.equal(tournament.arenaResults.length, 1);
  assert.equal(tournament.summaries.arenas[0].arenaEvents, 1);
  assert.ok(tournament.arenaResults[0].matches.length > 0);
});

test("pilot tournament degrades gracefully when a model turn returns malformed json", async () => {
  const tournament = await runPilotTournament({
    builderIds: ["solo_builder"],
    attackerIds: ["breaker_solo"],
    challengeIds: ["normalize-tags"],
    client: new FaultyAttackClient()
  });

  assert.equal(tournament.buildResults.length, 1);
  assert.equal(tournament.attackResults.length, 1);
  assert.equal(tournament.attackResults[0].successfulBreaks, 0);
  assert.match(
    tournament.attackResults[0].transcript[0].result.generationError,
    /malformed json/
  );
});

test("pilot tournament runs fix rounds after successful breaks", async () => {
  const tournament = await runPilotTournament({
    builderIds: ["repair_loop_builder"],
    attackerIds: ["breaker_solo"],
    challengeIds: ["settle-ledger"],
    client: new FixRoundClient()
  });

  assert.equal(tournament.attackResults[0].successfulBreaks, 1);
  assert.equal(tournament.fixResults.length, 1);
  assert.equal(tournament.fixResults[0].recoveredCases, 1);
  assert.equal(tournament.summaries.fixers[0].strategyId, "repair_loop_builder");
});

test("pilot tournament supports parallel multi-export system challenges", async () => {
  const tournament = await runPilotTournament({
    builderIds: ["universalist_solo", "parallel_clone_swarm"],
    attackerIds: [],
    challengeIds: ["ops-console-core"],
    client: new ParallelSystemClient(),
    enableFixRounds: false
  });

  assert.equal(tournament.buildResults.length, 2);
  assert.equal(tournament.swapResults.length, 2);
  assert.equal(
    tournament.buildResults.every((result) => result.evaluation.passedHidden === result.evaluation.totalHidden),
    true
  );
  assert.equal(
    tournament.buildResults.find((result) => result.strategyId === "parallel_clone_swarm").transcript.some(
      (entry) => entry.action === "build_fragment"
    ),
    true
  );
});

test("parallel fragment assembly uses harness workstream ownership instead of model-reported targets", async () => {
  const tournament = await runPilotTournament({
    builderIds: ["parallel_clone_swarm"],
    attackerIds: [],
    challengeIds: ["ops-console-core"],
    client: new MisroutedFragmentClient(),
    enableFixRounds: false
  });

  assert.equal(tournament.buildResults.length, 1);
  assert.equal(tournament.buildResults[0].evaluation.compiled, true);
  assert.equal(tournament.buildResults[0].evaluation.passedVisible, tournament.buildResults[0].evaluation.totalVisible);
});
