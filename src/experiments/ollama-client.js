import vm from "node:vm";

function extractJsonObject(text) {
  const trimmed = String(text ?? "").trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    // fall through
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  const candidate = trimmed.slice(firstBrace, lastBrace + 1);

  try {
    return JSON.parse(candidate);
  } catch {
    // fall through
  }

  try {
    return JSON.parse(candidate.replace(/\bundefined\b/g, "null"));
  } catch {
    // fall through
  }

  try {
    return vm.runInNewContext(`(${candidate})`, {}, { timeout: 1000 });
  } catch {
    return null;
  }
}

export class OllamaClient {
  constructor({
    baseUrl = "http://127.0.0.1:11434",
    model = "gemma4:e4b",
    temperature = 0.1,
    jsonMode = "json",
    requestTimeoutMs = 120000
  } = {}) {
    this.baseUrl = baseUrl;
    this.model = model;
    this.temperature = temperature;
    this.jsonMode = jsonMode;
    this.requestTimeoutMs = requestTimeoutMs;
  }

  async generate(prompt, { format = "text" } = {}) {
    const startedAt = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);
    let response;

    try {
      response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
          ...(format === "json" ? { format: this.jsonMode } : {}),
          options: {
            temperature: this.temperature
          }
        }),
        signal: controller.signal
      });
    } catch (error) {
      if (error?.name === "AbortError") {
        throw new Error(`Ollama request timed out after ${this.requestTimeoutMs}ms`);
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.status}`);
    }

    const payload = await response.json();
    const text = payload.response ?? "";
    const durationMs = Date.now() - startedAt;

    if (format === "json") {
      const parsed = extractJsonObject(text);
      if (!parsed) {
        throw new Error(`Failed to parse JSON response from model: ${text}`);
      }
      return {
        ...parsed,
        durationMs
      };
    }

    return {
      text,
      durationMs
    };
  }
}
