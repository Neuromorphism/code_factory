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
