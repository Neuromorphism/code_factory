import { makeId, nowIso } from "../utils.js";
import { buildVirtualLeagueStandings } from "./virtual-league.js";

const VIRTUAL_VENUES = [
  {
    name: "Summit Hall",
    city: "Boulder",
    atmosphere: "onsite finals floor with frozen scoreboards and visible nerves"
  },
  {
    name: "Ladder Dome",
    city: "Seattle",
    atmosphere: "live ladder arena with constant provisional rank swings"
  },
  {
    name: "Redline Theater",
    city: "Austin",
    atmosphere: "challenge phase pit with instant counterexample pressure"
  },
  {
    name: "Patchworks Lab",
    city: "Pittsburgh",
    atmosphere: "security gauntlet focused on break-fix survival"
  },
  {
    name: "Autonomy Annex",
    city: "Las Vegas",
    atmosphere: "autonomous offense-defense room with nonstop arena telemetry"
  }
];

function getVenue(index) {
  return VIRTUAL_VENUES[index % VIRTUAL_VENUES.length];
}

function buildEvent(styleId, tournament, index) {
  const venue = getVenue(index);
  const league = buildVirtualLeagueStandings(tournament, styleId);

  return {
    round: index + 1,
    styleId,
    title: `${league.style.label} at ${venue.name}`,
    venue,
    league,
    podium: league.standings.slice(0, 3)
  };
}

function aggregateSeasonPoints(events) {
  const pointsByPlace = [10, 7, 5, 3, 2, 1];
  const standings = new Map();

  for (const event of events) {
    event.league.standings.forEach((entry, index) => {
      if (!standings.has(entry.team)) {
        standings.set(entry.team, {
          team: entry.team,
          seasonPoints: 0,
          eventWins: 0,
          podiums: 0
        });
      }

      const team = standings.get(entry.team);
      team.seasonPoints += pointsByPlace[index] ?? 0;
      team.eventWins += index === 0 ? 1 : 0;
      team.podiums += index < 3 ? 1 : 0;
    });
  }

  return [...standings.values()].sort((left, right) => {
    if (right.seasonPoints !== left.seasonPoints) {
      return right.seasonPoints - left.seasonPoints;
    }
    if (right.eventWins !== left.eventWins) {
      return right.eventWins - left.eventWins;
    }
    return right.podiums - left.podiums;
  });
}

function buildTeamCards(tournament) {
  const seen = new Map();

  for (const result of tournament.buildResults || []) {
    if (seen.has(result.strategyId)) {
      continue;
    }

    const profile = result.teamProfile;
    seen.set(result.strategyId, {
      strategyId: result.strategyId,
      strategyLabel: result.strategyLabel,
      teamName: profile?.teamName ?? result.strategyLabel,
      archetype: profile?.archetype ?? "agent-team",
      backstory: profile?.backstory ?? "No custom backstory assigned for this run.",
      motto: profile?.motto ?? "Ship working code."
    });
  }

  return [...seen.values()];
}

function buildRivalries(tournament) {
  const rivalries = new Map();

  for (const result of tournament.swapResults || []) {
    const key = [result.attackerStrategyLabel, result.targetStrategyLabel].sort().join(" vs ");
    if (!rivalries.has(key)) {
      rivalries.set(key, {
        rivalry: key,
        totalSwapBreaks: 0
      });
    }

    rivalries.get(key).totalSwapBreaks += result.successfulBreaks;
  }

  return [...rivalries.values()]
    .sort((left, right) => right.totalSwapBreaks - left.totalSwapBreaks)
    .slice(0, 5);
}

export function buildVirtualSeason(tournament, { styleIds } = {}) {
  const selectedStyles = styleIds?.length
    ? styleIds
    : ["icpc_sprint", "topcoder_marathon", "srm_challenge", "bibifi_showdown", "aixcc_patch_race"];

  const events = selectedStyles.map((styleId, index) => buildEvent(styleId, tournament, index));

  return {
    id: makeId("season"),
    createdAt: nowIso(),
    circuitName: "Code Factory Grand Circuit",
    events,
    overallStandings: aggregateSeasonPoints(events),
    teamCards: buildTeamCards(tournament),
    rivalries: buildRivalries(tournament)
  };
}
