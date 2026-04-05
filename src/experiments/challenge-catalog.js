function normalizeTagsReference(input) {
  const seen = new Set();
  const output = [];

  for (const value of Array.isArray(input) ? input : []) {
    if (typeof value !== "string") {
      continue;
    }

    const normalized = value.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    output.push(normalized);
  }

  return output;
}

function settleLedgerReference(entries) {
  const balances = {};

  for (const entry of Array.isArray(entries) ? entries : []) {
    if (!entry || typeof entry.account !== "string" || typeof entry.amount !== "number") {
      continue;
    }

    const account = entry.account.trim().toLowerCase();
    if (!account) {
      continue;
    }

    balances[account] = (balances[account] ?? 0) + entry.amount;
    if (balances[account] < 0) {
      balances[account] = 0;
    }
  }

  return balances;
}

function rankPlayersReference(rounds) {
  const totals = new Map();

  for (const round of Array.isArray(rounds) ? rounds : []) {
    if (!round || typeof round.player !== "string" || typeof round.points !== "number") {
      continue;
    }

    const current = totals.get(round.player) ?? { player: round.player, points: 0, wins: 0 };
    current.points += round.points;
    if (round.won === true) {
      current.wins += 1;
    }
    totals.set(round.player, current);
  }

  return [...totals.values()].sort((left, right) => {
    if (right.points !== left.points) {
      return right.points - left.points;
    }
    if (right.wins !== left.wins) {
      return right.wins - left.wins;
    }
    return left.player.localeCompare(right.player);
  });
}

function chooseMoveReference(state) {
  if (!state || typeof state.tokensRemaining !== "number") {
    return 1;
  }

  const maxTake = Number.isInteger(state.maxTake) && state.maxTake > 0 ? state.maxTake : 3;
  const legalMax = Math.max(1, Math.min(maxTake, Math.floor(state.tokensRemaining)));
  const desired = state.tokensRemaining % (legalMax + 1);
  return Math.max(1, Math.min(legalMax, desired));
}

function makeCase(args) {
  return { args };
}

function makeTargetCase(target, args) {
  return { target, args };
}

function buildDashboardSummaryReference(payload) {
  const tags = normalizeTagsReference(payload?.tags);
  const balances = settleLedgerReference(payload?.entries);
  const leaderboard = rankPlayersReference(payload?.rounds);
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

export const CHALLENGE_CATALOG = [
  {
    id: "normalize-tags",
    label: "Normalize Tags",
    entryFunction: "normalizeTags",
    category: "data-cleaning",
    directCompetition: true,
    buildPrompt: [
      "Implement a JavaScript function named normalizeTags(input).",
      "Behavior:",
      "- input is expected to be an array of unknown values",
      "- keep only string values",
      "- trim whitespace",
      "- lowercase the remaining values",
      "- discard empty strings after trimming",
      "- remove duplicates while preserving first occurrence order",
      "- return the resulting array"
    ].join("\n"),
    breakPrompt:
      "Find adversarial input arrays that make a weak normalizeTags implementation violate the required normalization rules.",
    reference: normalizeTagsReference,
    visibleCases: [
      makeCase([[" Alpha ", "beta", "ALPHA", "", "Beta ", 42]]),
      makeCase([[null, "One", " two ", "ONE", ""]])
    ],
    hiddenCases: [
      makeCase([["", "  ", "X", "x", " Y ", "y ", "z"]]),
      makeCase([["Tag", { x: 1 }, " tag", "TAG ", " new "]])
    ]
  },
  {
    id: "settle-ledger",
    label: "Settle Ledger",
    entryFunction: "settleLedger",
    category: "state-update",
    directCompetition: true,
    buildPrompt: [
      "Implement a JavaScript function named settleLedger(entries).",
      "Behavior:",
      "- entries is expected to be an array of objects with account and amount",
      "- ignore entries without a string account or numeric amount",
      "- normalize accounts by trimming and lowercasing them",
      "- sum amounts by account",
      "- balances may not go below zero; clamp any negative running balance to zero",
      "- return a plain object mapping normalized account names to balances"
    ].join("\n"),
    breakPrompt:
      "Find adversarial ledger entry arrays that make a weak settleLedger implementation violate clamping, normalization, or filtering rules.",
    reference: settleLedgerReference,
    visibleCases: [
      makeCase([[{ account: "A", amount: 5 }, { account: " a ", amount: -2 }, { account: "B", amount: 3 }]]),
      makeCase([[{ account: "cash", amount: -7 }, { account: " cash ", amount: 4 }, { amount: 2 }]])
    ],
    hiddenCases: [
      makeCase([[{ account: "A", amount: -1 }, { account: "A", amount: 2 }, { account: "a ", amount: -5 }]]),
      makeCase([[{ account: " team ", amount: 3 }, null, { account: "TEAM", amount: 4 }, { account: "", amount: 9 }]])
    ]
  },
  {
    id: "rank-players",
    label: "Rank Players",
    entryFunction: "rankPlayers",
    category: "competitive-game",
    directCompetition: true,
    buildPrompt: [
      "Implement a JavaScript function named rankPlayers(rounds).",
      "Behavior:",
      "- rounds is expected to be an array of objects with player, points, and optional won boolean",
      "- ignore entries without a string player or numeric points",
      "- aggregate total points and win counts per player",
      "- return an array of objects { player, points, wins }",
      "- sort by descending points, then descending wins, then ascending player name"
    ].join("\n"),
    breakPrompt:
      "Find adversarial round arrays that make a weak rankPlayers implementation violate aggregation or tie-breaking rules.",
    reference: rankPlayersReference,
    visibleCases: [
      makeCase([[{ player: "Ada", points: 5, won: true }, { player: "Lin", points: 3 }, { player: "Ada", points: 2 }]]),
      makeCase([[{ player: "Bob", points: 4, won: true }, { player: "Ana", points: 4, won: false }]])
    ],
    hiddenCases: [
      makeCase([[{ player: "Bob", points: 4, won: true }, { player: "Ana", points: 4, won: true }, { player: "Ana", points: 0 }]]),
      makeCase([[{ player: "Zed", points: 1 }, { player: "Amy", points: 1 }, { player: "Amy", points: 0, won: true }]])
    ]
  },
  {
    id: "token-duel",
    label: "Token Duel Bot",
    entryFunction: "chooseMove",
    category: "direct-arena",
    directCompetition: true,
    arena: {
      type: "take_tokens",
      startingTokens: [7, 8, 9, 10, 11, 12],
      maxTake: 3
    },
    buildPrompt: [
      "Implement a JavaScript function named chooseMove(state).",
      "Behavior:",
      "- state is an object with tokensRemaining and optional maxTake",
      "- return an integer number of tokens to take this turn",
      "- the move must be between 1 and min(tokensRemaining, maxTake || 3)",
      "- favor moves that leave the opponent in a losing position when possible",
      "- always return a legal move even for unusual input"
    ].join("\n"),
    breakPrompt:
      "Find adversarial game states that make a weak chooseMove implementation return an illegal or strategically losing move.",
    reference: chooseMoveReference,
    visibleCases: [
      makeCase([{ tokensRemaining: 4, maxTake: 3 }]),
      makeCase([{ tokensRemaining: 7, maxTake: 3 }])
    ],
    hiddenCases: [
      makeCase([{ tokensRemaining: 10, maxTake: 3 }]),
      makeCase([{ tokensRemaining: 12, maxTake: 3 }])
    ]
  },
  {
    id: "ops-console-core",
    label: "Ops Console Core",
    category: "system-core",
    directCompetition: true,
    moduleExports: [
      "normalizeTags",
      "settleLedger",
      "rankPlayers",
      "buildDashboardSummary"
    ],
    parallelWorkstreams: [
      {
        id: "tags_core",
        target: "normalizeTags",
        label: "Tags Core",
        description: "Normalize, filter, dedupe, and preserve tag order."
      },
      {
        id: "ledger_core",
        target: "settleLedger",
        label: "Ledger Core",
        description: "Aggregate balances by normalized account and clamp negatives to zero."
      },
      {
        id: "ranking_core",
        target: "rankPlayers",
        label: "Ranking Core",
        description: "Aggregate player totals and apply deterministic tie-break rules."
      },
      {
        id: "dashboard_summary",
        target: "buildDashboardSummary",
        label: "Dashboard Summary",
        description: "Compose the other subsystems into a nested summary object for the UI."
      }
    ],
    buildPrompt: [
      "Implement a JavaScript module for the Ops Console core.",
      "Define these functions without export statements; the harness will export them:",
      "- normalizeTags(input): same semantics as the Normalize Tags task",
      "- settleLedger(entries): same semantics as the Settle Ledger task",
      "- rankPlayers(rounds): same semantics as the Rank Players task",
      "- buildDashboardSummary(payload):",
      "  - payload contains tags, entries, and rounds",
      "  - return an object { tags, balances, leaderboard, status }",
      "  - tags is normalizeTags(payload.tags)",
      "  - balances is settleLedger(payload.entries)",
      "  - leaderboard is rankPlayers(payload.rounds)",
      "  - status is { uniqueTags, activeAccounts, topPlayer, positiveBalanceTotal }",
      "  - topPlayer is the first leaderboard player or null",
      "  - positiveBalanceTotal is the sum of all balance values"
    ].join("\n"),
    breakPrompt:
      "Find adversarial cases against one or more exports in the Ops Console core module. Each case should target a specific exported function.",
    reference: {
      normalizeTags: normalizeTagsReference,
      settleLedger: settleLedgerReference,
      rankPlayers: rankPlayersReference,
      buildDashboardSummary: buildDashboardSummaryReference
    },
    visibleCases: [
      makeTargetCase("normalizeTags", [[" Alpha ", "beta", "ALPHA", "", "Beta ", 42]]),
      makeTargetCase("settleLedger", [[{ account: "A", amount: 5 }, { account: " a ", amount: -2 }, { account: "B", amount: 3 }]]),
      makeTargetCase("rankPlayers", [[{ player: "Ada", points: 5, won: true }, { player: "Lin", points: 3 }, { player: "Ada", points: 2 }]]),
      makeTargetCase("buildDashboardSummary", [{
        tags: [" Alpha ", "beta", "ALPHA", "", "Beta ", 42],
        entries: [{ account: "A", amount: 5 }, { account: " a ", amount: -2 }, { account: "B", amount: 3 }],
        rounds: [{ player: "Ada", points: 5, won: true }, { player: "Lin", points: 3 }, { player: "Ada", points: 2 }]
      }])
    ],
    hiddenCases: [
      makeTargetCase("normalizeTags", [["Tag", { x: 1 }, " tag", "TAG ", " new "]]),
      makeTargetCase("settleLedger", [[{ account: "cash", amount: -7 }, { account: " cash ", amount: 4 }, { amount: 2 }]]),
      makeTargetCase("rankPlayers", [[{ player: "Bob", points: 4, won: true }, { player: "Ana", points: 4, won: true }, { player: "Ana", points: 0 }]]),
      makeTargetCase("buildDashboardSummary", [{
        tags: ["Tag", { x: 1 }, " tag", "TAG ", " new "],
        entries: [{ account: "cash", amount: -7 }, { account: " cash ", amount: 4 }, { amount: 2 }],
        rounds: [{ player: "Bob", points: 4, won: true }, { player: "Ana", points: 4, won: true }, { player: "Ana", points: 0 }]
      }])
    ]
  }
];

export function listChallenges() {
  return CHALLENGE_CATALOG;
}

export function getChallenge(challengeId) {
  return CHALLENGE_CATALOG.find((challenge) => challenge.id === challengeId) ?? null;
}
