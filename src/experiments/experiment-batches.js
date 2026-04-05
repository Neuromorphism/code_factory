export const EXPERIMENT_BATCHES = [
  {
    id: "micro-smoke",
    label: "Micro Smoke",
    builderIds: ["solo_builder"],
    attackerIds: ["breaker_solo"],
    challengeIds: ["normalize-tags"]
  },
  {
    id: "smoke",
    label: "Smoke",
    builderIds: ["solo_builder", "pipeline_five_stage"],
    attackerIds: ["breaker_solo", "qa_fuzzer"],
    challengeIds: ["normalize-tags"]
  },
  {
    id: "builder-breaker-pilot",
    label: "Builder Breaker Pilot",
    builderIds: ["solo_builder", "pipeline_five_stage", "red_blue_builder"],
    attackerIds: ["breaker_solo", "fuzz_breaker", "qa_fuzzer"],
    challengeIds: ["normalize-tags", "settle-ledger"]
  },
  {
    id: "swap-arena",
    label: "Swap Arena",
    builderIds: ["solo_builder", "pipeline_five_stage", "red_blue_builder", "debate_architects"],
    attackerIds: ["breaker_solo", "qa_fuzzer"],
    challengeIds: ["rank-players", "settle-ledger"]
  },
  {
    id: "arena-circuit",
    label: "Arena Circuit",
    builderIds: ["pipeline_five_stage", "repair_loop_builder", "jury_red_team_builder", "contract_matrix_builder"],
    attackerIds: ["break_squad", "test_mesh"],
    challengeIds: ["token-duel", "rank-players"]
  },
  {
    id: "arena-smoke",
    label: "Arena Smoke",
    builderIds: ["solo_builder", "pipeline_five_stage"],
    attackerIds: ["breaker_solo"],
    challengeIds: ["token-duel"]
  },
  {
    id: "persona-cup",
    label: "Persona Cup",
    builderIds: ["pipeline_five_stage", "repair_loop_builder", "jury_red_team_builder"],
    attackerIds: ["break_squad", "mutation_breaker", "test_mesh"],
    challengeIds: ["normalize-tags", "token-duel"]
  },
  {
    id: "persona-smoke",
    label: "Persona Smoke",
    builderIds: ["pipeline_five_stage", "repair_loop_builder"],
    attackerIds: ["mutation_breaker", "test_mesh"],
    challengeIds: ["normalize-tags", "token-duel"]
  }
];

export function listExperimentBatches() {
  return EXPERIMENT_BATCHES;
}

export function getExperimentBatch(batchId) {
  return EXPERIMENT_BATCHES.find((batch) => batch.id === batchId) ?? null;
}
