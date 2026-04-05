export const FRAMEWORK_CATALOG = [
  {
    id: "codex-sdk",
    label: "Codex SDK",
    orchestrationLayer: "code_factory",
    executionLayer: "openai/codex",
    implementationLanguage: "TypeScript",
    summary: "Codex-native control path with the smallest adapter surface for the current prototype."
  },
  {
    id: "langgraph-codex",
    label: "LangGraph + Codex",
    orchestrationLayer: "langgraph",
    executionLayer: "openai/codex",
    implementationLanguage: "Python or TypeScript",
    summary: "Durable graph orchestration with Codex-style coding agents as the execution worker."
  },
  {
    id: "autogen-openai-compatible",
    label: "AutoGen",
    orchestrationLayer: "autogen",
    executionLayer: "openai-compatible local model",
    implementationLanguage: "Python",
    summary: "Explicit multi-agent team runtime for comparing more formal handoff patterns."
  },
  {
    id: "mastra-openai-compatible",
    label: "Mastra",
    orchestrationLayer: "mastra",
    executionLayer: "openai-compatible local model",
    implementationLanguage: "TypeScript",
    summary: "Workflow-first TypeScript contender with suspend and resume support."
  }
];

export function listFrameworkCatalog() {
  return FRAMEWORK_CATALOG;
}
