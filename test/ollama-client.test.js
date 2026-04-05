import test from "node:test";
import assert from "node:assert/strict";
import { OllamaClient } from "../src/experiments/ollama-client.js";

test("OllamaClient parses JSON responses from the local runtime", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    async json() {
      return {
        response: '{"summary":"ok","cases":[]}'
      };
    }
  });

  try {
    const client = new OllamaClient({
      baseUrl: "http://127.0.0.1:11434",
      requestTimeoutMs: 100
    });
    const result = await client.generate("prompt", { format: "json" });

    assert.equal(result.summary, "ok");
    assert.deepEqual(result.cases, []);
  } finally {
    global.fetch = originalFetch;
  }
});

test("OllamaClient fails cleanly when a request exceeds the timeout", async () => {
  const originalFetch = global.fetch;
  global.fetch = async (_url, options) =>
    new Promise((_resolve, reject) => {
      options.signal.addEventListener("abort", () => {
        const error = new Error("aborted");
        error.name = "AbortError";
        reject(error);
      });
    });

  try {
    const client = new OllamaClient({
      baseUrl: "http://127.0.0.1:11434",
      requestTimeoutMs: 10
    });

    await assert.rejects(
      () => client.generate("prompt", { format: "json" }),
      /timed out after 10ms/
    );
  } finally {
    global.fetch = originalFetch;
  }
});
