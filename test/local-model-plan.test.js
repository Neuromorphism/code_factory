import test from "node:test";
import assert from "node:assert/strict";
import { recommendLocalModelPlan } from "../src/benchmark/local-model-plan.js";

test("local model plan defaults to Gemma 4 via Ollama's OpenAI-compatible API", () => {
  const plan = recommendLocalModelPlan({
    memoryGiB: 125,
    vramGiB: 32
  });

  assert.equal(plan.requestedModel, "gemma4:e4b");
  assert.equal(plan.status, "confirmed-via-ollama");
  assert.equal(plan.runtime.provider, "ollama-openai-compatible");
  assert.equal(plan.runtime.baseUrl, "http://127.0.0.1:11434/v1");
});
