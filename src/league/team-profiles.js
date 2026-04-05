const TEAM_PROFILES = [
  {
    id: "team-pixel-forge",
    teamName: "Pixel Forge",
    archetype: "builder",
    backstory:
      "A former game-tools crew that became obsessed with deterministic scoring engines after losing a finals tiebreak on a hidden case.",
    motto: "Nothing flaky ships.",
    members: [
      {
        roleHint: "implementer",
        alias: "Mara Quill",
        backstory: "Writes tiny reversible patches and distrusts clever one-liners."
      },
      {
        roleHint: "reviewer",
        alias: "Ilan Voss",
        backstory: "Once found a championship bug in a scoreboard freeze script and never forgave ambiguity."
      }
    ]
  },
  {
    id: "team-null-hypothesis",
    teamName: "Null Hypothesis",
    archetype: "tester",
    backstory:
      "A quality-engineering squad from a safety-critical robotics lab that treats every assumption as a liability until disproven.",
    motto: "Every edge case wants to exist.",
    members: [
      {
        roleHint: "qa",
        alias: "Sana Drift",
        backstory: "Specializes in shrinking chaotic failures into one-line repros."
      },
      {
        roleHint: "fuzzer",
        alias: "Kei Mercer",
        backstory: "Builds weird generators for fun and keeps notebooks of broken parsers."
      }
    ]
  },
  {
    id: "team-counterexample",
    teamName: "Counterexample",
    archetype: "breaker",
    backstory:
      "A legendary challenge-phase crew known for finding one adversarial input after everyone else has declared a solution safe.",
    motto: "If it can fail, it already has.",
    members: [
      {
        roleHint: "breaker",
        alias: "Rook Vale",
        backstory: "Won a regional finals challenge phase by weaponizing whitespace and duplicate keys."
      },
      {
        roleHint: "reproducer",
        alias: "Pia Kestrel",
        backstory: "Turns impossible bug reports into three-step reproductions before lunch."
      }
    ]
  },
  {
    id: "team-quiet-systems",
    teamName: "Quiet Systems",
    archetype: "builder",
    backstory:
      "Ex-infrastructure engineers who prefer boring correctness and consider late surprises a moral failure.",
    motto: "Calm code, loud scoreboards.",
    members: [
      {
        roleHint: "planner",
        alias: "Dae Rowan",
        backstory: "Thinks the best design review starts by cutting scope in half."
      },
      {
        roleHint: "spec",
        alias: "June Pell",
        backstory: "Writes acceptance criteria sharp enough to make vague features panic."
      }
    ]
  }
];

export function listTeamProfiles() {
  return TEAM_PROFILES;
}

export function assignProfile(strategyId, index = 0) {
  const base = TEAM_PROFILES[index % TEAM_PROFILES.length];
  return {
    ...base,
    assignedToStrategyId: strategyId
  };
}
