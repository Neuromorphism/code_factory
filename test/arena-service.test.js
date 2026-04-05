import test from "node:test";
import assert from "node:assert/strict";
import { getChallenge } from "../src/experiments/challenge-catalog.js";
import { runArenaRoundRobin } from "../src/experiments/arena-service.js";

const tokenDuel = getChallenge("token-duel");

test("arena round robin ranks stronger token bots above weaker ones", async () => {
  const arena = await runArenaRoundRobin(tokenDuel, [
    {
      strategyId: "optimal",
      strategyLabel: "Optimal Bot",
      code: `
function chooseMove(state) {
  const tokens = Number(state?.tokensRemaining) || 1;
  const maxTake = Math.max(1, Math.min(Number(state?.maxTake) || 3, tokens));
  const winning = tokens % (maxTake + 1);
  return winning === 0 ? 1 : winning;
}
      `
    },
    {
      strategyId: "naive",
      strategyLabel: "Naive Bot",
      code: `
function chooseMove(state) {
  return 1;
}
      `
    }
  ]);

  assert.equal(arena.challengeId, "token-duel");
  assert.equal(arena.matches.length > 0, true);
  assert.equal(arena.standings[0].strategyId, "optimal");
  assert.equal(arena.standings[0].matchPoints > arena.standings[1].matchPoints, true);
});
