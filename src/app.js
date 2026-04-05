import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AgentBackendRegistry } from "./backend-registry.js";
import { createCompetitionSpec } from "./benchmark/competition-service.js";
import { CompetitionResultRepository } from "./benchmark/result-repository.js";
import { GitService } from "./git-service.js";
import { listExperimentBatches } from "./experiments/experiment-batches.js";
import { createExperimentTemplate } from "./experiments/experiment-service.js";
import { listCompetitionStyles } from "./league/competition-styles.js";
import { listTeamProfiles } from "./league/team-profiles.js";
import { HarnessOrchestrator } from "./orchestrator.js";
import { createSession } from "./plan-service.js";
import { getProjectType, listProjectTypes, listSyntheticUsers } from "./project-types.js";
import { HarnessStore } from "./store.js";
import { WORKFLOW_PROTOCOL } from "./workflow-protocol.js";
import { WorkspaceService } from "./workspace-service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function json(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload, null, 2));
}

async function readJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (!chunks.length) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function getSessionIdFromUrl(url) {
  const parts = url.pathname.split("/").filter(Boolean);
  return parts[2] ?? null;
}

async function serveStatic(response, publicDir, pathname) {
  const filePath =
    pathname === "/"
      ? path.join(publicDir, "index.html")
      : path.join(publicDir, pathname.replace(/^\//, ""));

  const ext = path.extname(filePath);
  const contentType =
    {
      ".html": "text/html; charset=utf-8",
      ".js": "application/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8"
    }[ext] || "text/plain; charset=utf-8";

  try {
    const content = await readFile(filePath);
    response.writeHead(200, { "Content-Type": contentType });
    response.end(content);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}

function createSseStream(store, response, sessionId) {
  response.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive"
  });
  response.write(": connected\n\n");

  const unsubscribe = store.onEvent((event) => {
    if (event.sessionId !== sessionId) {
      return;
    }

    response.write("event: progress\n");
    response.write(`data: ${JSON.stringify(event)}\n\n`);
  });

  response.on("close", () => {
    unsubscribe();
    response.end();
  });
}

export function createHarnessApp({
  repoRoot = path.resolve(__dirname, ".."),
  publicDir = path.resolve(__dirname, "../public"),
  storagePath = path.resolve(repoRoot, ".code-factory/sessions.json"),
  competitionResultsDir = path.resolve(repoRoot, "docs/competition-results"),
  seed = true,
  backendRegistry = new AgentBackendRegistry(),
  store = new HarnessStore({ storagePath })
} = {}) {
  const competitionResultRepository = new CompetitionResultRepository({
    baseDir: competitionResultsDir
  });
  const workspaceService = new WorkspaceService({
    repoRoot,
    gitServiceFactory: () => new GitService({ repoRoot })
  });
  const orchestrator = new HarnessOrchestrator({
    store,
    backendRegistry,
    gitServiceFactory: () => new GitService({ repoRoot })
    ,
    workspaceService
  });

  if (seed && store.listSessions().length === 0) {
    store.createSession(
      createSession({
        projectType: "developer-tooling",
        systemName: "Code Factory Delivery Harness",
        desiredOutcome:
          "Collaborate with the user to define a system, plan it one function or service at a time, execute a strict role sequence, and expose live delivery state.",
        constraints: [
          "One work item should be active at a time.",
          "Every item must pass through Spec Writer, Planner, Implementer, QA / Tester, and Reviewer in order.",
          "Branch creation should default to preview-only until the user opts into local git mutation.",
          "The dashboard should show the delivery plan and live role progress without a page reload."
        ].join("\n"),
        branchMode: "plan-only",
        agentBackendId: "simulated"
      })
    );
  }

  const server = createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (request.method === "GET" && url.pathname === "/api/health") {
      return json(response, 200, {
        ok: true,
        sessionCount: store.listSessions().length
      });
    }

    if (request.method === "GET" && url.pathname === "/api/backends") {
      return json(response, 200, {
        backends: backendRegistry.list()
      });
    }

    if (request.method === "GET" && url.pathname === "/api/project-types") {
      return json(response, 200, {
        projectTypes: listProjectTypes(),
        syntheticUsers: listSyntheticUsers(),
        workflowProtocol: WORKFLOW_PROTOCOL
      });
    }

    if (request.method === "GET" && url.pathname === "/api/competition/template") {
      return json(response, 200, {
        competition: createCompetitionSpec({
          machineProfile: {
            memoryGiB: 125,
            vramGiB: 32
          }
        })
      });
    }

    if (request.method === "GET" && url.pathname === "/api/competition/results") {
      return json(response, 200, {
        results: competitionResultRepository.listResults()
      });
    }

    if (request.method === "GET" && url.pathname === "/api/competition/tournaments") {
      return json(response, 200, {
        tournaments: competitionResultRepository.listTournamentArtifacts()
      });
    }

    if (request.method === "GET" && url.pathname === "/api/experiments/template") {
      return json(response, 200, {
        experiment: createExperimentTemplate(),
        batches: listExperimentBatches(),
        leagueStyles: listCompetitionStyles(),
        teamProfiles: listTeamProfiles()
      });
    }

    if (request.method === "GET" && url.pathname === "/api/experiments/results") {
      return json(response, 200, {
        results: competitionResultRepository.listTournamentArtifacts()
      });
    }

    if (request.method === "GET" && url.pathname === "/api/sessions") {
      return json(response, 200, {
        sessions: store.listSessions()
      });
    }

    if (request.method === "GET" && url.pathname.startsWith("/api/sessions/") && url.pathname.endsWith("/export")) {
      const session = store.getSession(getSessionIdFromUrl(url));
      if (!session) {
        return json(response, 404, { error: "Session not found" });
      }

      return json(response, 200, {
        artifact: session.artifacts.incrementalPrPlan
      });
    }

    if (
      request.method === "GET" &&
      url.pathname.startsWith("/api/sessions/") &&
      !url.pathname.endsWith("/events") &&
      !url.pathname.endsWith("/export")
    ) {
      const session = store.getSession(getSessionIdFromUrl(url));
      if (!session) {
        return json(response, 404, { error: "Session not found" });
      }

      return json(response, 200, { session });
    }

    if (request.method === "POST" && url.pathname === "/api/sessions") {
      const payload = await readJsonBody(request);
      const normalizedPayload = {
        ...payload,
        projectType: getProjectType(payload.projectType).id
      };
      const session = store.createSession(createSession(normalizedPayload));
      return json(response, 201, { session });
    }

    if (request.method === "POST" && url.pathname.endsWith("/start")) {
      const sessionId = getSessionIdFromUrl(url);
      const session = store.getSession(sessionId);
      if (!session) {
        return json(response, 404, { error: "Session not found" });
      }

      orchestrator.startSession(sessionId).catch((error) => {
        store.publish({
          sessionId,
          type: "session-error",
          level: "error",
          message: error.message
        });
        store.updateSession(sessionId, (draft) => {
          draft.status = "blocked";
        });
      });

      return json(response, 202, {
        session: store.getSession(sessionId)
      });
    }

    if (request.method === "POST" && url.pathname.endsWith("/reset")) {
      const sessionId = getSessionIdFromUrl(url);

      try {
        const session = orchestrator.resetSession(sessionId);
        return json(response, 200, { session });
      } catch (error) {
        return json(response, 409, { error: error.message });
      }
    }

    if (request.method === "GET" && url.pathname.endsWith("/events")) {
      const sessionId = getSessionIdFromUrl(url);
      const session = store.getSession(sessionId);
      if (!session) {
        return json(response, 404, { error: "Session not found" });
      }

      return createSseStream(store, response, sessionId);
    }

    return serveStatic(response, publicDir, url.pathname);
  });

  return {
    server,
    store,
    backendRegistry,
    orchestrator,
    async start(port = 3000) {
      await new Promise((resolve) => server.listen(port, resolve));
      return server.address();
    },
    async close() {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  };
}
