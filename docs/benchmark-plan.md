# Benchmark Plan

## Objective

Build `code_factory` into a control plane that can:

1. orchestrate a strict software-delivery workflow with Codex as the top-level planner,
2. swap execution workers underneath that orchestration layer,
3. compare framework implementations on `SWE-bench Lite` using resolution rate and wall-clock time.

## Solid Plan

### Orchestrator

- `Codex 5.4` remains the control-plane orchestrator.
- The existing Node server, SSE feed, session store, and dashboard remain the user-facing shell.
- The orchestration protocol stays fixed:
  1. Spec Writer
  2. Planner
  3. Implementer
  4. QA / Tester
  5. Reviewer

### Local model slot

- The coding worker slot is model-provider agnostic.
- The first local runner target is `gemma4:e4b` behind Ollama's OpenAI-compatible HTTP interface.
- Runner preference order:
  1. `vLLM`
  2. `llama.cpp` server
  3. `Ollama`

### Competition lineup

- `codex-sdk`
- `langgraph-codex`
- `autogen-openai-compatible`
- `mastra-openai-compatible`

### Benchmark scope

- Start with a `SWE-bench Lite` pilot, not the full benchmark.
- Initial pilot size: `10` instances.
- Primary metrics:
  - resolved rate
  - mean time to completion
  - median time to completion

## Prototype Milestones

### Milestone 1

- Encode the competition plan and framework catalog in the app.
- Add result aggregation utilities and an API endpoint that exposes the benchmark template.

### Milestone 2

- Add runner adapters for the first two framework entries.
- Capture run records and stream benchmark status into the dashboard.

### Milestone 3

- Provision the local model runner.
- Execute the pilot and collect comparable results.

## Current blocker

- The runtime scaffold is ready, but the first local model pull still needs to complete before the first real competition run can start.
- If `gemma4:e4b` underperforms or fails operationally on this host, the fallback remains the latest supported Gemma family release.
