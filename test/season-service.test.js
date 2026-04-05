import test from "node:test";
import assert from "node:assert/strict";
import { buildVirtualSeason } from "../src/league/season-service.js";

const tournament = {
  buildResults: [
    {
      strategyId: "alpha",
      strategyLabel: "Alpha",
      durationMs: 1000,
      score: 8,
      teamProfile: {
        teamName: "Alpha Forge",
        archetype: "builder",
        backstory: "A meticulous builder squad.",
        motto: "Ship clean."
      },
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
      durationMs: 3000,
      score: 5,
      teamProfile: {
        teamName: "Beta Breakers",
        archetype: "breaker",
        backstory: "A sharp challenge-phase squad.",
        motto: "Exploit first."
      },
      evaluation: {
        passedHidden: 1,
        totalHidden: 2,
        passedVisible: 2,
        hiddenFailures: [{}],
        visibleFailures: []
      }
    }
  ],
  attackResults: [
    {
      targetStrategyId: "alpha",
      successfulBreaks: 1
    }
  ],
  swapResults: [
    {
      attackerStrategyId: "beta",
      attackerStrategyLabel: "Beta",
      targetStrategyId: "alpha",
      targetStrategyLabel: "Alpha",
      successfulBreaks: 2
    }
  ],
  fixResults: [
    {
      strategyId: "alpha",
      recoveredCases: 2,
      remainingCases: 0,
      evaluation: {
        passedHidden: 2,
        passedVisible: 2
      }
    }
  ],
  summaries: {
    builders: [{ label: "Alpha", totalBuildScore: 8 }],
    breakers: [{ label: "Beta", successfulBreaks: 2 }],
    defenses: [{ label: "Alpha", successfulBreaksAgainstIt: 3, remainingBreaksAfterFix: 0 }],
    fixers: [{ label: "Alpha", recoveredBreaks: 2 }]
  }
};

test("virtual season assembles events, season standings, team cards, and rivalries", () => {
  const season = buildVirtualSeason(tournament);

  assert.equal(season.events.length >= 5, true);
  assert.equal(season.overallStandings[0].team, "Alpha");
  assert.equal(season.teamCards.length, 2);
  assert.equal(season.rivalries[0].rivalry, "Alpha vs Beta");
});
