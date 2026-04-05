import { CodexBackend } from "./agent-backends/codex-backend.js";
import { SimulatedAgentBackend } from "./agent-backends/simulated-backend.js";
const PLANNED_BACKENDS = [
  {
    id: "openai-compatible",
    label: "OpenAI-Compatible Backend",
    provider: "openai-compatible",
    kind: "remote",
    available: false,
    configurable: true,
    summary: "Planned adapter for non-Codex OpenAI-compatible agent APIs."
  },
  {
    id: "command-runner",
    label: "Command Runner Backend",
    provider: "local",
    kind: "subprocess",
    available: false,
    configurable: true,
    summary: "Planned adapter for local or remote agent CLIs invoked as subprocess workers."
  }
];

export class AgentBackendRegistry {
  constructor({ backends = [new SimulatedAgentBackend(), new CodexBackend()] } = {}) {
    this.backends = new Map(backends.map((backend) => [backend.id, backend]));
  }

  list() {
    return [...this.backends.values()].map((backend) => backend.descriptor()).concat(PLANNED_BACKENDS);
  }

  getExecutionBackend(id) {
    return this.backends.get(id) ?? this.backends.get("simulated");
  }
}
