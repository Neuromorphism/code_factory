export function recommendLocalModelPlan(machineProfile = {}) {
  const vramGiB = machineProfile.vramGiB ?? 0;
  const memoryGiB = machineProfile.memoryGiB ?? 0;

  return {
    requestedModel: "gemma4:e4b",
    status: "confirmed-via-ollama",
    runtime: {
      provider: "ollama-openai-compatible",
      baseUrl: "http://127.0.0.1:11434/v1",
      apiShape: "openai-chat-completions"
    },
    notes: [
      "Gemma 4 is confirmed as available through Ollama, which also exposes an OpenAI-compatible API surface.",
      "The local execution slot should expose an OpenAI-compatible HTTP interface so framework adapters stay provider-agnostic.",
      "Codex remains the orchestration model even when the coding worker model changes.",
      "If Gemma 4 fails operationally on this host, the fallback remains the latest supported Gemma family release."
    ],
    preferredRunners: [
      {
        id: "vllm-openai-compatible",
        label: "vLLM OpenAI-compatible server",
        summary: "Best fit for a local OpenAI-compatible endpoint on a high-memory GPU."
      },
      {
        id: "llama-cpp-server",
        label: "llama.cpp server",
        summary: "Simple local HTTP option when quantized models are the priority."
      },
      {
        id: "ollama",
        label: "Ollama",
        summary: "Convenient local model runner when model packaging is already available."
      }
    ],
    hardwareAssessment: {
      memoryGiB,
      vramGiB,
      recommendedScale:
        vramGiB >= 30
          ? "High-end local inference is feasible on a single GPU."
          : "Use smaller or quantized local models for stable single-GPU runs."
    }
  };
}
