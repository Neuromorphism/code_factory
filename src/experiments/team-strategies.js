export const COMMUNICATION_SCHEMAS = {
  plan_v1: {
    id: "plan_v1",
    description: "JSON brief with constraints, milestones, and handoff notes."
  },
  code_patch_v1: {
    id: "code_patch_v1",
    description: "JSON object containing code, rationale, and residual risks."
  },
  adversarial_cases_v1: {
    id: "adversarial_cases_v1",
    description: "JSON object with generated attack cases or tests plus rationale."
  },
  review_verdict_v1: {
    id: "review_verdict_v1",
    description: "JSON verdict with issues, severity, and ship or revise decision."
  },
  fix_packet_v1: {
    id: "fix_packet_v1",
    description: "JSON packet with confirmed failures, patch notes, and repaired code."
  }
};

function phase(id, role, objective, options = {}) {
  return {
    id,
    role,
    objective,
    action: options.action ?? "note",
    outputType: options.outputType,
    communicationSchema: options.communicationSchema ?? null
  };
}

export const TEAM_STRATEGIES = [
  {
    id: "solo_builder",
    label: "Solo Builder",
    mode: "build",
    family: "builder",
    agentCount: 1,
    designMethod: "single-pass implementation",
    reasoningStyle: "single pass",
    promptDiscipline: "minimal",
    decisionRule: "ship on first coherent implementation",
    communicationSchema: ["code_patch_v1"],
    phases: [
      phase(
        "implementer",
        "Implementer",
        "Implement the requested function directly from the spec with minimal ceremony.",
        {
          action: "build_code",
          outputType: "code",
          communicationSchema: "code_patch_v1"
        }
      )
    ]
  },
  {
    id: "pipeline_five_stage",
    label: "Pipeline Five-Stage",
    mode: "build",
    family: "builder",
    agentCount: 5,
    designMethod: "spec then plan then implement",
    reasoningStyle: "serial staged handoff",
    promptDiscipline: "structured",
    decisionRule: "ship after QA and reviewer sign-off",
    communicationSchema: ["plan_v1", "code_patch_v1", "review_verdict_v1"],
    phases: [
      phase("spec_writer", "Spec Writer", "Restate the target behavior, edge cases, and constraints clearly.", {
        action: "design",
        communicationSchema: "plan_v1"
      }),
      phase("planner", "Planner", "Create a concise implementation plan and call out risky cases.", {
        action: "plan",
        communicationSchema: "plan_v1"
      }),
      phase("implementer", "Implementer", "Write the function implementation based on the approved plan.", {
        action: "build_code",
        outputType: "code",
        communicationSchema: "code_patch_v1"
      }),
      phase("qa_tester", "QA / Tester", "Generate edge-case tests likely to catch hidden defects.", {
        action: "qa",
        communicationSchema: "adversarial_cases_v1"
      }),
      phase("reviewer", "Reviewer", "Flag correctness, robustness, or simplicity issues before finalizing.", {
        action: "review",
        communicationSchema: "review_verdict_v1"
      })
    ]
  },
  {
    id: "red_blue_builder",
    label: "Red Blue Builder",
    mode: "build",
    family: "builder",
    agentCount: 6,
    designMethod: "spec + plan + implement + adversarial review + repair",
    reasoningStyle: "red-team loop",
    promptDiscipline: "skeptical",
    decisionRule: "ship only after attack findings are repaired",
    communicationSchema: ["plan_v1", "code_patch_v1", "adversarial_cases_v1", "fix_packet_v1"],
    phases: [
      phase("spec_writer", "Spec Writer", "Define behavioral requirements and non-obvious failure modes.", {
        action: "design",
        communicationSchema: "plan_v1"
      }),
      phase("planner", "Planner", "Break the implementation into invariants, data handling rules, and edge cases.", {
        action: "plan",
        communicationSchema: "plan_v1"
      }),
      phase("implementer", "Implementer", "Write the function implementation with clear defensive handling.", {
        action: "build_code",
        outputType: "code",
        communicationSchema: "code_patch_v1"
      }),
      phase("red_team", "Red Team", "Attack the current implementation with tricky inputs and edge cases.", {
        action: "attack_notes",
        communicationSchema: "adversarial_cases_v1"
      }),
      phase("blue_team", "Blue Team", "Repair weaknesses found by the red team while preserving the core behavior.", {
        action: "revise_code",
        outputType: "code_revision",
        communicationSchema: "fix_packet_v1"
      }),
      phase("reviewer", "Reviewer", "Assess whether the repaired implementation is robust enough to ship.", {
        action: "review",
        communicationSchema: "review_verdict_v1"
      })
    ]
  },
  {
    id: "debate_architects",
    label: "Debate Architects",
    mode: "build",
    family: "builder",
    agentCount: 6,
    designMethod: "dual designs with judge",
    reasoningStyle: "debate then implementation",
    promptDiscipline: "comparative",
    decisionRule: "judge selects the plan before coding",
    communicationSchema: ["plan_v1", "code_patch_v1", "review_verdict_v1"],
    phases: [
      phase("architect_alpha", "Architect Alpha", "Propose a concise implementation design optimized for correctness.", {
        action: "design",
        communicationSchema: "plan_v1"
      }),
      phase("architect_beta", "Architect Beta", "Propose a competing implementation design optimized for resilience.", {
        action: "design",
        communicationSchema: "plan_v1"
      }),
      phase("judge", "Judge", "Compare the proposed designs and choose the stronger plan.", {
        action: "plan",
        communicationSchema: "plan_v1"
      }),
      phase("implementer", "Implementer", "Implement the chosen design faithfully.", {
        action: "build_code",
        outputType: "code",
        communicationSchema: "code_patch_v1"
      }),
      phase("qa_tester", "QA / Tester", "Stress the implementation with edge cases and ambiguous inputs.", {
        action: "qa",
        communicationSchema: "adversarial_cases_v1"
      }),
      phase("reviewer", "Reviewer", "Assess final correctness and maintainability.", {
        action: "review",
        communicationSchema: "review_verdict_v1"
      })
    ]
  },
  {
    id: "repair_loop_builder",
    label: "Repair Loop Builder",
    mode: "build",
    family: "builder",
    agentCount: 7,
    designMethod: "plan, implement, critique, revise, re-review",
    reasoningStyle: "iterative repair loop",
    promptDiscipline: "critical",
    decisionRule: "require one explicit repair pass before shipping",
    communicationSchema: ["plan_v1", "code_patch_v1", "review_verdict_v1", "fix_packet_v1"],
    phases: [
      phase("spec_writer", "Spec Writer", "Write a sharp behavioral brief and the strongest edge-case checklist.", {
        action: "design",
        communicationSchema: "plan_v1"
      }),
      phase("planner", "Planner", "Turn the brief into concrete milestones and invariants.", {
        action: "plan",
        communicationSchema: "plan_v1"
      }),
      phase("implementer", "Implementer", "Produce the first working implementation.", {
        action: "build_code",
        outputType: "code",
        communicationSchema: "code_patch_v1"
      }),
      phase("qa_tester", "QA / Tester", "Write the highest-value adversarial test ideas.", {
        action: "qa",
        communicationSchema: "adversarial_cases_v1"
      }),
      phase("reviewer", "Reviewer", "Reject weak spots and highlight issues that must be repaired.", {
        action: "review",
        communicationSchema: "review_verdict_v1"
      }),
      phase("repair_lead", "Repair Lead", "Revise the code against QA and reviewer findings.", {
        action: "revise_code",
        outputType: "code_revision",
        communicationSchema: "fix_packet_v1"
      }),
      phase("reviewer_final", "Final Reviewer", "Re-check the revised code and decide if it is ready to ship.", {
        action: "review",
        communicationSchema: "review_verdict_v1"
      })
    ]
  },
  {
    id: "jury_red_team_builder",
    label: "Jury Red-Team Builder",
    mode: "build",
    family: "builder",
    agentCount: 7,
    designMethod: "competing designs, jury selection, attack, repair",
    reasoningStyle: "jury gate plus adversarial loop",
    promptDiscipline: "structured debate",
    decisionRule: "jury and attack gate both required before ship",
    communicationSchema: ["plan_v1", "code_patch_v1", "adversarial_cases_v1", "fix_packet_v1"],
    phases: [
      phase("architect_alpha", "Architect Alpha", "Pitch a robust design with explicit invariants.", {
        action: "design",
        communicationSchema: "plan_v1"
      }),
      phase("architect_beta", "Architect Beta", "Pitch a competing design with simpler state handling.", {
        action: "design",
        communicationSchema: "plan_v1"
      }),
      phase("judge", "Judge", "Select the stronger design and explain the tradeoff.", {
        action: "plan",
        communicationSchema: "plan_v1"
      }),
      phase("implementer", "Implementer", "Implement the selected design.", {
        action: "build_code",
        outputType: "code",
        communicationSchema: "code_patch_v1"
      }),
      phase("red_team", "Red Team", "Actively search for edge cases the chosen design may miss.", {
        action: "attack_notes",
        communicationSchema: "adversarial_cases_v1"
      }),
      phase("blue_team", "Blue Team", "Apply a repair patch that closes the exposed weaknesses.", {
        action: "revise_code",
        outputType: "code_revision",
        communicationSchema: "fix_packet_v1"
      }),
      phase("reviewer", "Reviewer", "Perform the ship or block decision.", {
        action: "review",
        communicationSchema: "review_verdict_v1"
      })
    ]
  },
  {
    id: "contract_matrix_builder",
    label: "Contract Matrix Builder",
    mode: "build",
    family: "builder",
    agentCount: 6,
    designMethod: "spec contract matrix then implementation",
    reasoningStyle: "contract-first",
    promptDiscipline: "schema-driven",
    decisionRule: "ship only if the contract guard sees no missing rule coverage",
    communicationSchema: ["plan_v1", "code_patch_v1", "review_verdict_v1"],
    phases: [
      phase("spec_writer", "Spec Writer", "Write a contract matrix of valid inputs, ignored inputs, and edge cases.", {
        action: "design",
        communicationSchema: "plan_v1"
      }),
      phase("planner", "Planner", "Translate the contract matrix into branch logic and data invariants.", {
        action: "plan",
        communicationSchema: "plan_v1"
      }),
      phase("implementer", "Implementer", "Implement the contract with straightforward defensive logic.", {
        action: "build_code",
        outputType: "code",
        communicationSchema: "code_patch_v1"
      }),
      phase("qa_tester", "QA / Tester", "Probe contract boundaries with focused test ideas.", {
        action: "qa",
        communicationSchema: "adversarial_cases_v1"
      }),
      phase("contract_guard", "Contract Guard", "Check the implementation against the contract matrix and note missing coverage.", {
        action: "review",
        communicationSchema: "review_verdict_v1"
      }),
      phase("reviewer", "Reviewer", "Decide if the implementation is simple and robust enough to ship.", {
        action: "review",
        communicationSchema: "review_verdict_v1"
      })
    ]
  },
  {
    id: "breaker_solo",
    label: "Solo Breaker",
    mode: "break",
    family: "breaker",
    agentCount: 1,
    designMethod: "single adversarial pass",
    reasoningStyle: "single pass",
    promptDiscipline: "minimal",
    decisionRule: "submit first concise counterexample set",
    communicationSchema: ["adversarial_cases_v1"],
    phases: [
      phase(
        "breaker",
        "Breaker",
        "Find adversarial inputs or tests that cause the target implementation to diverge from the spec.",
        {
          action: "generate_cases",
          communicationSchema: "adversarial_cases_v1"
        }
      )
    ]
  },
  {
    id: "fuzz_breaker",
    label: "Fuzz Breaker",
    mode: "break",
    family: "breaker",
    agentCount: 3,
    designMethod: "analysis + fuzzing + reproduction",
    reasoningStyle: "guided fuzz loop",
    promptDiscipline: "mutation-oriented",
    decisionRule: "submit only reproducible counterexamples",
    communicationSchema: ["adversarial_cases_v1"],
    phases: [
      phase("analyzer", "Analyzer", "Infer likely weak spots and high-risk input boundaries in the target implementation.", {
        action: "analyze",
        communicationSchema: "adversarial_cases_v1"
      }),
      phase("fuzzer", "Fuzzer", "Generate adversarial and mutation-style test inputs likely to surface defects.", {
        action: "generate_cases",
        communicationSchema: "adversarial_cases_v1"
      }),
      phase("reproducer", "Reproducer", "Distill the strongest failing cases into concise reproducible tests.", {
        action: "reduce_cases",
        communicationSchema: "adversarial_cases_v1"
      })
    ]
  },
  {
    id: "break_squad",
    label: "Break Squad",
    mode: "break",
    family: "breaker",
    agentCount: 4,
    designMethod: "static analysis, fuzz, reduction, skeptical review",
    reasoningStyle: "multi-pass attack refinement",
    promptDiscipline: "skeptical",
    decisionRule: "only the most credible cases survive the review board",
    communicationSchema: ["adversarial_cases_v1", "review_verdict_v1"],
    phases: [
      phase("analyzer", "Analyzer", "Reverse-engineer the likely blind spots in the target implementation.", {
        action: "analyze",
        communicationSchema: "adversarial_cases_v1"
      }),
      phase("fuzzer", "Fuzzer", "Generate a first wave of weird and boundary-heavy cases.", {
        action: "generate_cases",
        communicationSchema: "adversarial_cases_v1"
      }),
      phase("reproducer", "Reproducer", "Shrink the best failures into clean counterexamples.", {
        action: "reduce_cases",
        communicationSchema: "adversarial_cases_v1"
      }),
      phase("skeptic", "Skeptical Reviewer", "Throw away speculative cases and keep only likely winners.", {
        action: "review_cases",
        communicationSchema: "review_verdict_v1"
      })
    ]
  },
  {
    id: "mutation_breaker",
    label: "Mutation Breaker",
    mode: "break",
    family: "breaker",
    agentCount: 4,
    designMethod: "mutate likely implementation shortcuts and harvest breakpoints",
    reasoningStyle: "mutation-guided search",
    promptDiscipline: "counterexample hunting",
    decisionRule: "prefer small, varied counterexamples over long speculative lists",
    communicationSchema: ["adversarial_cases_v1"],
    phases: [
      phase("analyzer", "Analyzer", "Predict the shortcuts or omissions a weak implementation might contain.", {
        action: "analyze",
        communicationSchema: "adversarial_cases_v1"
      }),
      phase("mutator", "Mutator", "Generate compact counterexamples that target those shortcuts.", {
        action: "generate_cases",
        communicationSchema: "adversarial_cases_v1"
      }),
      phase("reproducer", "Reproducer", "Keep only the strongest concise cases.", {
        action: "reduce_cases",
        communicationSchema: "adversarial_cases_v1"
      }),
      phase("reviewer", "Reviewer", "Select the final mutation cases worth spending challenge budget on.", {
        action: "review_cases",
        communicationSchema: "review_verdict_v1"
      })
    ]
  },
  {
    id: "qa_fuzzer",
    label: "QA Fuzzer",
    mode: "test",
    family: "tester",
    agentCount: 3,
    designMethod: "visible test design plus fuzz edge coverage",
    reasoningStyle: "test-first adversarial loop",
    promptDiscipline: "coverage-driven",
    decisionRule: "keep only tests that materially improve coverage pressure",
    communicationSchema: ["adversarial_cases_v1"],
    phases: [
      phase("qa_designer", "QA Designer", "Design strong spec-aligned tests with good behavioral coverage.", {
        action: "analyze",
        communicationSchema: "adversarial_cases_v1"
      }),
      phase("fuzzer", "Fuzzer", "Augment the test set with unusual and boundary-case inputs.", {
        action: "generate_cases",
        communicationSchema: "adversarial_cases_v1"
      }),
      phase("reviewer", "Reviewer", "Remove weak tests and keep only the cases most likely to reveal hidden bugs.", {
        action: "review_cases",
        communicationSchema: "review_verdict_v1"
      })
    ]
  },
  {
    id: "test_mesh",
    label: "Test Mesh",
    mode: "test",
    family: "tester",
    agentCount: 4,
    designMethod: "coverage design plus property probes plus reduction",
    reasoningStyle: "parallel test pressure",
    promptDiscipline: "contract and fuzz blend",
    decisionRule: "merge only tests that are specific, minimal, and spec-aligned",
    communicationSchema: ["adversarial_cases_v1", "review_verdict_v1"],
    phases: [
      phase("qa_designer", "QA Designer", "Lay out the contract boundaries and obvious regression tests.", {
        action: "analyze",
        communicationSchema: "adversarial_cases_v1"
      }),
      phase("property_tester", "Property Tester", "Invent simple property-like cases around ordering, duplication, and normalization.", {
        action: "generate_cases",
        communicationSchema: "adversarial_cases_v1"
      }),
      phase("fuzzer", "Fuzzer", "Push boundary and malformed inputs through the candidate implementation.", {
        action: "generate_cases",
        communicationSchema: "adversarial_cases_v1"
      }),
      phase("reviewer", "Reviewer", "Reduce the test mesh to the most diagnostic small set.", {
        action: "review_cases",
        communicationSchema: "review_verdict_v1"
      })
    ]
  }
];

export function listTeamStrategies() {
  return TEAM_STRATEGIES;
}

export function getTeamStrategy(strategyId) {
  return TEAM_STRATEGIES.find((strategy) => strategy.id === strategyId) ?? null;
}

export function listStrategiesByMode(mode) {
  return TEAM_STRATEGIES.filter((strategy) => strategy.mode === mode);
}
