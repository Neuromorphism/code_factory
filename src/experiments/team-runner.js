import { evaluateImplementation, scoreAttackCases } from "./code-evaluator.js";
import { COMMUNICATION_SCHEMAS } from "./team-strategies.js";

function jsonBlockPrompt(instructions, schemaHint) {
  return [instructions, "", "Return valid JSON only. Do not include markdown fences.", schemaHint].join("\n");
}

function sanitizeCode(code) {
  return String(code ?? "")
    .replace(/^```[a-z]*\n?/i, "")
    .replace(/\n```$/, "")
    .trim();
}

function describeSchema(schemaId) {
  return COMMUNICATION_SCHEMAS[schemaId]?.description ?? schemaId;
}

function formatStrategyContext(strategy, phase) {
  const activeSchemas = [phase.communicationSchema].filter(Boolean).length
    ? [phase.communicationSchema].filter(Boolean)
    : strategy.communicationSchema;

  return [
    `Team system: ${strategy.label}.`,
    strategy.topology ? `Team topology: ${strategy.topology}.` : "",
    strategy.taskDistribution === "broadcast_all"
      ? "Task distribution: every team member can see the full task bundle."
      : "",
    strategy.memoryModel ? `Coordination memory: ${strategy.memoryModel}.` : "",
    strategy.coordinationProtocol ? `Coordination protocol: ${strategy.coordinationProtocol}.` : "",
    strategy.topology === "decentralized"
      ? "There is no central coordinator. Read the shared coordination substrate, contribute the highest-value delta, and leave mergeable notes for peers."
      : "",
    strategy.internalLoop?.length
      ? `Internal loop before answering: ${strategy.internalLoop.join(" -> ")}.`
      : "",
    `Design method: ${strategy.designMethod}.`,
    `Reasoning style: ${strategy.reasoningStyle}.`,
    strategy.promptDiscipline ? `Prompt discipline: ${strategy.promptDiscipline}.` : "",
    strategy.decisionRule ? `Decision rule: ${strategy.decisionRule}.` : "",
    activeSchemas.length
      ? `Structured handoff format: ${activeSchemas
          .map((schemaId) => `${schemaId} (${describeSchema(schemaId)})`)
          .join("; ")}.`
      : ""
  ]
    .filter(Boolean)
    .join("\n");
}

function createSharedBoard() {
  return {
    summaries: [],
    designs: [],
    edgeCases: [],
    milestones: [],
    tests: [],
    issues: [],
    attacks: [],
    changes: [],
    cases: []
  };
}

function pushUniqueEntries(list, values, limit = 12) {
  const next = [...list];

  for (const value of values ?? []) {
    const normalized = String(value ?? "").trim();
    if (!normalized || next.includes(normalized)) {
      continue;
    }
    next.push(normalized);
  }

  return next.slice(0, limit);
}

function updateBoard(board, phase, result) {
  board.summaries = pushUniqueEntries(board.summaries, [
    result?.summary ? `${phase.role}: ${result.summary}` : ""
  ]);
  board.designs = pushUniqueEntries(board.designs, [result?.design, ...(result?.weakPoints || [])]);
  board.edgeCases = pushUniqueEntries(board.edgeCases, result?.edgeCases || []);
  board.milestones = pushUniqueEntries(board.milestones, result?.milestones || []);
  board.tests = pushUniqueEntries(board.tests, result?.tests || []);
  board.issues = pushUniqueEntries(board.issues, result?.issues || []);
  board.attacks = pushUniqueEntries(board.attacks, result?.attacks || []);
  board.changes = pushUniqueEntries(board.changes, result?.changes || []);
  board.cases = dedupeCases(board.cases.concat(result?.cases || []));
}

function formatBoard(board) {
  const payload = {
    summaries: board.summaries,
    designs: board.designs,
    edgeCases: board.edgeCases,
    milestones: board.milestones,
    tests: board.tests,
    issues: board.issues,
    attacks: board.attacks,
    changes: board.changes,
    cases: board.cases
  };

  const hasContent = Object.values(payload).some((value) => Array.isArray(value) && value.length);
  if (!hasContent) {
    return "";
  }

  return `Shared coordination substrate:\n${JSON.stringify(payload, null, 2)}`;
}

function formatPersona(teamProfile, phase) {
  if (!teamProfile) {
    return "";
  }

  const phaseNeedle = `${phase.role} ${phase.id}`.toLowerCase();
  const member = teamProfile.members.find((entry) => phaseNeedle.includes(entry.roleHint.toLowerCase()));

  return [
    `You are competing as part of team ${teamProfile.teamName}.`,
    `Team backstory: ${teamProfile.backstory}`,
    `Team motto: ${teamProfile.motto}`,
    member ? `Your member persona is ${member.alias}. Backstory: ${member.backstory}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

function formatList(label, entries) {
  if (!entries?.length) {
    return "";
  }

  return `${label}\n- ${entries.join("\n- ")}`;
}

function caseKey(entry) {
  return JSON.stringify(entry?.args ?? []);
}

function dedupeCases(cases) {
  const seen = new Set();
  const output = [];

  for (const entry of cases ?? []) {
    if (!entry || !Array.isArray(entry.args)) {
      continue;
    }

    const key = caseKey(entry);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push({
      args: entry.args,
      why: entry.why ?? entry.reason ?? "diagnostic case"
    });
  }

  return output;
}

function totalDuration(transcript) {
  return transcript.reduce((total, entry) => total + (entry.result?.durationMs ?? 0), 0);
}

async function generateJson(client, prompt, fallback = {}) {
  try {
    return await client.generate(prompt, { format: "json" });
  } catch (error) {
    return {
      ...fallback,
      summary: fallback.summary ?? "generation failed",
      generationError: error instanceof Error ? error.message : String(error),
      durationMs: 0
    };
  }
}

async function runBuildStrategy(strategy, challenge, client, options = {}) {
  const transcript = [];
  const sharedBoard = createSharedBoard();
  let planSummary = "";
  let qaNotes = [];
  let reviewerNotes = [];
  let attackNotes = [];
  let currentCode = "";
  const teamProfile = options.teamProfile ?? null;

  for (const phase of strategy.phases) {
    const boardContext = formatBoard(sharedBoard);
    const sharedContext = [
      `You are the ${phase.role} in a software delivery team.`,
      formatStrategyContext(strategy, phase),
      formatPersona(teamProfile, phase),
      `Challenge: ${challenge.label}`,
      challenge.buildPrompt,
      boardContext
    ]
      .filter(Boolean)
      .join("\n\n");

    if (phase.action === "build_code") {
      const prompt = jsonBlockPrompt(
        [
          sharedContext,
          planSummary ? `Approved plan summary:\n${planSummary}` : "",
          formatList("Known QA concerns:", qaNotes),
          formatList("Reviewer concerns:", reviewerNotes),
          formatList("Adversarial findings:", attackNotes),
          `Write only the JavaScript needed for a function named ${challenge.entryFunction}.`,
          "Prefer defensive handling over cleverness."
        ]
          .filter(Boolean)
          .join("\n\n"),
        '{"summary":"string","code":"function ...","risks":["string"]}'
      );

      const result = await generateJson(client, prompt, { code: "", risks: [] });
      currentCode = sanitizeCode(result.code);
      updateBoard(sharedBoard, phase, result);
      transcript.push({ phase: phase.id, role: phase.role, action: phase.action, result });
      continue;
    }

    if (phase.action === "revise_code") {
      const prompt = jsonBlockPrompt(
        [
          sharedContext,
          `Current implementation:\n${currentCode}`,
          formatList("Known QA concerns:", qaNotes),
          formatList("Reviewer concerns:", reviewerNotes),
          formatList("Adversarial findings:", attackNotes),
          "Revise the implementation to address the strongest concerns while preserving the required behavior."
        ]
          .filter(Boolean)
          .join("\n\n"),
        '{"summary":"string","code":"function ...","changes":["string"]}'
      );

      const result = await generateJson(client, prompt, { code: currentCode, changes: [] });
      currentCode = sanitizeCode(result.code);
      updateBoard(sharedBoard, phase, result);
      transcript.push({ phase: phase.id, role: phase.role, action: phase.action, result });
      continue;
    }

    if (phase.action === "design") {
      const prompt = jsonBlockPrompt(
        [
          sharedContext,
          `Visible examples:\n${JSON.stringify(challenge.visibleCases, null, 2)}`,
          planSummary ? `Prior design notes:\n${planSummary}` : ""
        ]
          .filter(Boolean)
          .join("\n\n"),
        '{"summary":"string","edgeCases":["string"],"design":"string"}'
      );
      const result = await generateJson(client, prompt, { design: "", edgeCases: [] });
      planSummary += `${phase.role}: ${result.summary}\nDesign: ${result.design}\n`;
      updateBoard(sharedBoard, phase, result);
      transcript.push({ phase: phase.id, role: phase.role, action: phase.action, result });
      continue;
    }

    if (phase.action === "plan") {
      const prompt = jsonBlockPrompt(
        [sharedContext, planSummary ? `Prior design notes:\n${planSummary}` : ""]
          .filter(Boolean)
          .join("\n\n"),
        '{"summary":"string","milestones":["string"],"risks":["string"]}'
      );
      const result = await generateJson(client, prompt, { milestones: [], risks: [] });
      planSummary += `${phase.role}: ${result.summary}\nMilestones: ${(result.milestones || []).join("; ")}\n`;
      updateBoard(sharedBoard, phase, result);
      transcript.push({ phase: phase.id, role: phase.role, action: phase.action, result });
      continue;
    }

    if (phase.action === "qa") {
      const prompt = jsonBlockPrompt(
        [
          sharedContext,
          `Current implementation:\n${currentCode}`,
          `Visible examples:\n${JSON.stringify(challenge.visibleCases, null, 2)}`,
          "Identify the highest-risk edge cases or tests."
        ].join("\n\n"),
        '{"summary":"string","tests":["string"],"risks":["string"]}'
      );
      const result = await generateJson(client, prompt, { tests: [], risks: [] });
      qaNotes = [...qaNotes, ...(result.tests || []), ...(result.risks || [])];
      updateBoard(sharedBoard, phase, result);
      transcript.push({ phase: phase.id, role: phase.role, action: phase.action, result });
      continue;
    }

    if (phase.action === "review") {
      const prompt = jsonBlockPrompt(
        [
          sharedContext,
          `Current implementation:\n${currentCode}`,
          formatList("QA concerns:", qaNotes),
          formatList("Adversarial findings:", attackNotes)
        ]
          .filter(Boolean)
          .join("\n\n"),
        '{"summary":"string","issues":["string"],"decision":"approve|needs_work"}'
      );
      const result = await generateJson(client, prompt, { issues: [], decision: "needs_work" });
      reviewerNotes = [...reviewerNotes, ...(result.issues || [])];
      updateBoard(sharedBoard, phase, result);
      transcript.push({ phase: phase.id, role: phase.role, action: phase.action, result });
      continue;
    }

    if (phase.action === "attack_notes") {
      const prompt = jsonBlockPrompt(
        [
          sharedContext,
          `Current implementation:\n${currentCode}`,
          "List the strongest likely breakpoints or edge cases."
        ].join("\n\n"),
        '{"summary":"string","attacks":["string"]}'
      );
      const result = await generateJson(client, prompt, { attacks: [], risks: [] });
      attackNotes = [...attackNotes, ...(result.attacks || [])];
      updateBoard(sharedBoard, phase, result);
      transcript.push({ phase: phase.id, role: phase.role, action: phase.action, result });
    }
  }

  const evaluation = await evaluateImplementation(challenge, currentCode);

  return {
    kind: "build",
    strategyId: strategy.id,
    strategyLabel: strategy.label,
    challengeId: challenge.id,
    teamProfile,
    code: currentCode,
    transcript,
    evaluation,
    score: evaluation.passedVisible * 2 + evaluation.passedHidden * 3,
    durationMs: totalDuration(transcript)
  };
}

async function runAttackStrategy(strategy, challenge, targetCode, client, options = {}) {
  const transcript = [];
  const sharedBoard = createSharedBoard();
  const analysisNotes = [];
  let candidatePool = [];
  const teamProfile = options.teamProfile ?? null;

  for (const phase of strategy.phases) {
    const boardContext = formatBoard(sharedBoard);
    const sharedContext = [
      `You are the ${phase.role} in an adversarial software evaluation team.`,
      formatStrategyContext(strategy, phase),
      formatPersona(teamProfile, phase),
      `Challenge: ${challenge.label}`,
      challenge.buildPrompt,
      `Target implementation:\n${targetCode}`,
      `Visible examples:\n${JSON.stringify(challenge.visibleCases, null, 2)}`,
      boardContext
    ]
      .filter(Boolean)
      .join("\n\n");

    if (phase.action === "analyze") {
      const prompt = jsonBlockPrompt(
        [
          sharedContext,
          candidatePool.length
            ? `Existing candidate cases:\n${JSON.stringify(candidatePool, null, 2)}`
            : "",
          "Infer likely weaknesses, shortcuts, or blind spots in the target implementation."
        ]
          .filter(Boolean)
          .join("\n\n"),
        '{"summary":"string","weakPoints":["string"],"cases":[{"args":[...],"why":"string"}]}'
      );
      const result = await generateJson(client, prompt, { findings: [], risks: [] });
      analysisNotes.push(result.summary, ...(result.weakPoints || []));
      candidatePool = dedupeCases(candidatePool.concat(result.cases || []));
      updateBoard(sharedBoard, phase, result);
      transcript.push({ phase: phase.id, role: phase.role, action: phase.action, result });
      continue;
    }

    if (phase.action === "generate_cases") {
      const prompt = jsonBlockPrompt(
        [
          sharedContext,
          formatList("Known weak points:", analysisNotes),
          candidatePool.length
            ? `Current candidate pool:\n${JSON.stringify(candidatePool, null, 2)}`
            : "",
          "Generate concise adversarial test cases likely to make the target implementation fail."
        ]
          .filter(Boolean)
          .join("\n\n"),
        '{"summary":"string","cases":[{"args":[...],"why":"string"}]}'
      );
      const result = await generateJson(client, prompt, { cases: [] });
      candidatePool = dedupeCases(candidatePool.concat(result.cases || []));
      updateBoard(sharedBoard, phase, result);
      transcript.push({ phase: phase.id, role: phase.role, action: phase.action, result });
      continue;
    }

    if (phase.action === "reduce_cases" || phase.action === "review_cases") {
      const prompt = jsonBlockPrompt(
        [
          sharedContext,
          formatList("Known weak points:", analysisNotes),
          `Candidate pool:\n${JSON.stringify(candidatePool, null, 2)}`,
          "Keep only the strongest, most reproducible adversarial cases."
        ].join("\n\n"),
        '{"summary":"string","cases":[{"args":[...],"why":"string"}]}'
      );
      const result = await generateJson(client, prompt, { cases: candidatePool, discarded: [] });
      candidatePool = dedupeCases((result.cases || []).length ? result.cases : candidatePool);
      updateBoard(sharedBoard, phase, result);
      transcript.push({ phase: phase.id, role: phase.role, action: phase.action, result });
    }
  }

  const score = await scoreAttackCases(challenge, targetCode, candidatePool);

  return {
    kind: "attack",
    strategyId: strategy.id,
    strategyLabel: strategy.label,
    challengeId: challenge.id,
    teamProfile,
    transcript,
    proposedCases: candidatePool,
    score,
    successfulBreaks: score.successfulCases.length,
    durationMs: totalDuration(transcript)
  };
}

export async function runFixStrategy(strategy, challenge, client, options = {}) {
  const teamProfile = options.teamProfile ?? null;
  const currentCode = options.currentCode ?? "";
  const successfulCases = options.successfulCases ?? [];
  const revisionPhase =
    strategy.phases.find((phase) => phase.action === "revise_code") ?? {
      id: "fix_lead",
      role: "Fix Lead",
      action: "revise_code",
      communicationSchema: "fix_packet_v1"
    };

  const prompt = jsonBlockPrompt(
    [
      `You are the ${revisionPhase.role} in a software repair round.`,
      formatStrategyContext(strategy, revisionPhase),
      formatPersona(teamProfile, revisionPhase),
      `Challenge: ${challenge.label}`,
      challenge.buildPrompt,
      `Current implementation:\n${currentCode}`,
      `Confirmed failing cases:\n${JSON.stringify(successfulCases, null, 2)}`,
      `Write a repaired implementation for ${challenge.entryFunction} that preserves the required behavior and fixes the confirmed failures.`
    ]
      .filter(Boolean)
      .join("\n\n"),
    '{"summary":"string","code":"function ...","changes":["string"]}'
  );

  const result = await generateJson(client, prompt, { code: currentCode, changes: [] });
  const repairedCode = sanitizeCode(result.code);
  const evaluation = await evaluateImplementation(challenge, repairedCode, {
    extraCases: successfulCases.map((entry) => ({ args: entry.args }))
  });

  return {
    kind: "fix",
    strategyId: strategy.id,
    strategyLabel: strategy.label,
    challengeId: challenge.id,
    teamProfile,
    priorCode: currentCode,
    code: repairedCode,
    transcript: [{ phase: revisionPhase.id, role: revisionPhase.role, action: revisionPhase.action, result }],
    confirmedFailures: successfulCases.length,
    recoveredCases: evaluation.passedExtra,
    remainingCases: evaluation.extraFailures.length,
    evaluation,
    durationMs: result.durationMs ?? 0
  };
}

function toAttackAction(action) {
  switch (action) {
    case "design":
    case "plan":
    case "review":
      return "analyze";
    case "qa":
    case "attack_notes":
      return "generate_cases";
    default:
      return null;
  }
}

function deriveAttackStrategy(strategy) {
  const phases = strategy.phases
    .map((phase) => {
      const action = toAttackAction(phase.action);
      if (!action) {
        return null;
      }

      return {
        ...phase,
        action
      };
    })
    .filter(Boolean);

  if (phases.length) {
    return {
      ...strategy,
      mode: "break",
      phases: phases.concat({
        id: "swap_reviewer",
        role: "Swap Reviewer",
        action: "review_cases",
        objective: "Keep only the strongest concise swap attacks.",
        communicationSchema: "review_verdict_v1"
      })
    };
  }

  return {
    ...strategy,
    mode: "break",
    phases: [
      {
        id: "swap_analyzer",
        role: "Swap Analyzer",
        action: "analyze",
        objective: "Infer likely failure modes in the opponent implementation.",
        communicationSchema: "adversarial_cases_v1"
      },
      {
        id: "swap_breaker",
        role: "Swap Breaker",
        action: "generate_cases",
        objective: "Generate concise counterexamples against the opponent implementation.",
        communicationSchema: "adversarial_cases_v1"
      },
      {
        id: "swap_reviewer",
        role: "Swap Reviewer",
        action: "review_cases",
        objective: "Keep only the strongest concise swap attacks.",
        communicationSchema: "review_verdict_v1"
      }
    ]
  };
}

export async function runAttackWithAnyStrategy(strategy, challenge, client, options = {}) {
  const attackStrategy = strategy.mode === "build" ? deriveAttackStrategy(strategy) : strategy;
  return runAttackStrategy(attackStrategy, challenge, options.targetCode, client, options);
}

export async function runStrategy(strategy, challenge, client, options = {}) {
  if (strategy.mode === "build") {
    return runBuildStrategy(strategy, challenge, client, options);
  }

  if (strategy.mode === "break" || strategy.mode === "test") {
    return runAttackStrategy(strategy, challenge, options.targetCode, client, options);
  }

  throw new Error(`Unsupported strategy mode: ${strategy.mode}`);
}
