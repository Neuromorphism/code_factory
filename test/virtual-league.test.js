import test from "node:test";
import assert from "node:assert/strict";
import { buildVirtualLeagueStandings } from "../src/league/virtual-league.js";

const tournament = {
  buildResults: [
    {
      strategyId: "alpha",
      strategyLabel: "Alpha",
      durationMs: 1000,
      score: 8,
      evaluation: {
        passedHidden: 2,
        totalHidden: 2,
        passedVisible: 2,
        hiddenFailures: [],
        visibleFailures: []
      }
    },
    {
      strategyId: "beta",
      strategyLabel: "Beta",
      durationMs: 5000,
      score: 5,
      evaluation: {
        passedHidden: 1,
        totalHidden: 2,
        passedVisible: 2,
        hiddenFailures: [{}, {}],
        visibleFailures: [{}]
      }
    }
  ],
  attackResults: [
    {
      targetStrategyId: "beta",
      successfulBreaks: 2
    }
  ],
  swapResults: [
    {
      attackerStrategyId: "alpha",
      successfulBreaks: 2
    },
    {
      attackerStrategyId: "beta",
      successfulBreaks: 0
    }
  ],
  arenaResults: [
    {
      standings: [
        { strategyId: "alpha", wins: 3, losses: 1, matchPoints: 9 },
        { strategyId: "beta", wins: 1, losses: 3, matchPoints: 3 }
      ]
    }
  ],
  fixResults: [
    {
      strategyId: "alpha",
      recoveredCases: 2,
      remainingCases: 0
    },
    {
      strategyId: "beta",
      recoveredCases: 0,
      remainingCases: 2
    }
  ]
};

test("virtual league builds standings in multiple real-world-inspired styles", () => {
  const icpc = buildVirtualLeagueStandings(tournament, "icpc_sprint");
  const srm = buildVirtualLeagueStandings(tournament, "srm_challenge");
  const bibifi = buildVirtualLeagueStandings(tournament, "bibifi_showdown");
  const aixcc = buildVirtualLeagueStandings(tournament, "aixcc_patch_race");

  assert.equal(icpc.standings[0].team, "Alpha");
  assert.equal(srm.standings[0].team, "Alpha");
  assert.equal(srm.style.id, "srm_challenge");
  assert.equal(bibifi.standings[0].team, "Alpha");
  assert.equal(aixcc.standings[0].team, "Alpha");
  assert.ok(aixcc.highlights.length >= 1);
});
