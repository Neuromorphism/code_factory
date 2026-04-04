import { Codex } from "@openai/codex-sdk";
import { buildRolePrompt, roleOutputSchema, safeParseStructuredOutput } from "../role-contracts.js";
import { getWorkflowRole } from "../workflow-protocol.js";

function summarizeItem(item) {
  switch (item.type) {
    case "reasoning":
      return item.text;
    case "command_execution":
      return `Command: ${item.command} [${item.status}]`;
    case "file_change":
      return `Files changed: ${item.changes.map((change) => `${change.kind}:${change.path}`).join(", ")}`;
    case "mcp_tool_call":
      return `MCP tool: ${item.server}/${item.tool} [${item.status}]`;
    case "todo_list":
      return `Todo list updated with ${item.items.length} entries.`;
    case "web_search":
      return `Web search: ${item.query}`;
    case "error":
      return `Agent item error: ${item.message}`;
    case "agent_message":
      return item.text;
    default:
      return `Unhandled item type ${item.type}`;
  }
}

function buildArtifact(role, data, item) {
  return {
    kind: role.id,
    title: `${item.title} ${role.label.toLowerCase()} artifact`,
    summary: data?.summary || `${role.label} completed ${item.title}.`,
    data
  };
}

export class CodexBackend {
  constructor({
    codexFactory = (options) => new Codex(options),
    codexOptions = {},
    threadDefaults = {}
  } = {}) {
    this.id = "codex-cli";
    this.label = "Codex CLI Backend";
    this.provider = "openai/codex";
    this.kind = "local-cli";
    this.codexFactory = codexFactory;
    this.codexOptions = codexOptions;
    this.threadDefaults = threadDefaults;
  }

  descriptor() {
    return {
      id: this.id,
      label: this.label,
      provider: this.provider,
      kind: this.kind,
      available: true,
      configurable: true,
      summary: "Uses the openai/codex TypeScript SDK to run agent roles in local workspaces with streamed events."
    };
  }

  async *runRole({ session, item, roleId, workspace, backendConfig = {} }) {
    const role = getWorkflowRole(roleId);
    const codex = this.codexFactory(this.codexOptions);
    const threadOptions = {
      ...this.threadDefaults,
      model: backendConfig.model || "gpt-5-codex",
      sandboxMode: backendConfig.sandboxMode || "workspace-write",
      approvalPolicy: backendConfig.approvalPolicy || "on-request",
      modelReasoningEffort: backendConfig.modelReasoningEffort || "medium",
      workingDirectory: workspace.path,
      skipGitRepoCheck: backendConfig.skipGitRepoCheck ?? true,
      networkAccessEnabled: backendConfig.networkAccessEnabled ?? false,
      additionalDirectories: backendConfig.additionalDirectories || []
    };

    const thread = item.execution.threadId
      ? codex.resumeThread(item.execution.threadId, threadOptions)
      : codex.startThread(threadOptions);

    const prompt = buildRolePrompt({ session, item, role });
    const { events } = await thread.runStreamed(prompt, {
      outputSchema: roleOutputSchema(roleId)
    });

    let finalStructuredOutput = null;

    for await (const event of events) {
      if (event.type === "thread.started") {
        yield {
          type: "state",
          message: `Codex thread started for ${role.label}.`,
          state: {
            threadId: event.thread_id
          }
        };
        continue;
      }

      if (event.type === "turn.completed") {
        yield {
          type: "log",
          message: `${role.label} consumed ${event.usage.output_tokens} output tokens.`,
          progress: role.progressCeiling
        };
        continue;
      }

      if (event.type === "turn.failed" || event.type === "error") {
        throw new Error(event.error?.message || event.message || `${role.label} failed.`);
      }

      if (event.type === "item.completed") {
        if (event.item.type === "agent_message") {
          finalStructuredOutput = safeParseStructuredOutput(event.item.text);
        }

        yield {
          type: "log",
          message: summarizeItem(event.item),
          progress: role.progressCeiling
        };
      }
    }

    if (thread.id) {
      yield {
        type: "state",
        message: `Persisted Codex thread ${thread.id}.`,
        state: {
          threadId: thread.id
        }
      };
    }

    if (finalStructuredOutput) {
      yield {
        type: "artifact",
        message: `${role.label} produced a structured artifact.`,
        artifact: buildArtifact(role, finalStructuredOutput, item)
      };
    }

    if (role.checklistKey) {
      yield {
        type: "checklist",
        message: `${role.label} completed its required handoff.`,
        checklistKey: role.checklistKey,
        value: true
      };
    }
  }
}
