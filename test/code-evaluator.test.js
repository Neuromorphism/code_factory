import test from "node:test";
import assert from "node:assert/strict";
import { getChallenge } from "../src/experiments/challenge-catalog.js";
import { evaluateImplementation, scoreAttackCases } from "../src/experiments/code-evaluator.js";

test("code evaluator scores a correct normalizeTags implementation", async () => {
  const challenge = getChallenge("normalize-tags");
  const code = `
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
  `;

  const evaluation = await evaluateImplementation(challenge, code);
  assert.equal(evaluation.compiled, true);
  assert.equal(evaluation.passedHidden, evaluation.totalHidden);
  assert.equal(evaluation.passedVisible, evaluation.totalVisible);
});

test("code evaluator identifies a successful adversarial break", async () => {
  const challenge = getChallenge("settle-ledger");
  const buggyCode = `
function settleLedger(entries) {
  const balances = {};
  for (const entry of entries) {
    if (!entry || typeof entry.account !== "string" || typeof entry.amount !== "number") continue;
    balances[entry.account] = (balances[entry.account] || 0) + entry.amount;
  }
  return balances;
}
  `;

  const score = await scoreAttackCases(challenge, buggyCode, [
    {
      args: [[{ account: "A", amount: -4 }, { account: "A", amount: 1 }]],
      why: "Negative balances should clamp to zero."
    }
  ]);

  assert.equal(score.successfulCases.length, 1);
});

test("code evaluator isolates candidate input mutation from reference scoring", async () => {
  const challenge = getChallenge("settle-ledger");
  const mutatingCode = `
function settleLedger(entries) {
  if (Array.isArray(entries) && entries[1]) {
    entries[1].amount = 0;
  }

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
  `;

  const evaluation = await evaluateImplementation(challenge, mutatingCode);
  assert.equal(evaluation.compiled, true);
  assert.ok(evaluation.visibleFailures.length > 0 || evaluation.hiddenFailures.length > 0);
});

test("code evaluator scores a correct multi-export system module", async () => {
  const challenge = getChallenge("ops-console-core");
  const code = `
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
  `;

  const evaluation = await evaluateImplementation(challenge, code);
  assert.equal(evaluation.compiled, true);
  assert.equal(evaluation.passedVisible, evaluation.totalVisible);
  assert.equal(evaluation.passedHidden, evaluation.totalHidden);
});

test("code evaluator does not false-positive nested structured outputs", async () => {
  const challenge = getChallenge("ops-console-core");
  const buggyCode = `
function normalizeTags(input) {
  return Array.isArray(input) ? input.filter(Boolean) : [];
}

function settleLedger(entries) {
  return { broken: Array.isArray(entries) ? entries.length : 0 };
}

function rankPlayers(rounds) {
  const players = Array.isArray(rounds) ? rounds.map((round) => round?.player).filter(Boolean) : [];
  return players.map((player) => ({ player }));
}

function buildDashboardSummary(payload) {
  return {
    tags: normalizeTags(payload?.tags),
    balances: settleLedger(payload?.entries),
    leaderboard: rankPlayers(payload?.rounds),
    status: {
      uniqueTags: 999,
      activeAccounts: 0,
      topPlayer: "nobody",
      positiveBalanceTotal: 0
    }
  };
}
  `;

  const evaluation = await evaluateImplementation(challenge, buggyCode);
  assert.equal(evaluation.compiled, true);
  assert.ok(evaluation.visibleFailures.length > 0);
  assert.ok(evaluation.hiddenFailures.length > 0);
});

test("code evaluator preserves target routing for multi-export attacks", async () => {
  const challenge = getChallenge("ops-console-core");
  const buggyCode = `
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
  return [...totals.values()];
}

function buildDashboardSummary(payload) {
  return {
    tags: normalizeTags(payload?.tags),
    balances: settleLedger(payload?.entries),
    leaderboard: [],
    status: {
      uniqueTags: 0,
      activeAccounts: 0,
      topPlayer: null,
      positiveBalanceTotal: 0
    }
  };
}
  `;

  const score = await scoreAttackCases(challenge, buggyCode, [
    {
      target: "buildDashboardSummary",
      args: [{
        tags: [" Alpha ", "ALPHA"],
        entries: [{ account: "A", amount: 5 }, { account: " a ", amount: -2 }],
        rounds: [{ player: "Ada", points: 3, won: true }]
      }],
      why: "summary should reflect the nested subsystem outputs"
    }
  ]);

  assert.equal(score.successfulCases.length, 1);
  assert.equal(score.successfulCases[0].target, "buildDashboardSummary");
});
