const state = {
  sessions: [],
  session: null,
  projectTypes: [],
  syntheticUsers: [],
  workflowProtocol: [],
  backends: [],
  competitionResults: [],
  experimentResults: [],
  eventSource: null
};

const sessionSelect = document.querySelector("#session-select");
const projectTypeSelect = document.querySelector("#project-type");
const syntheticUserSelect = document.querySelector("#synthetic-user");
const backendSelect = document.querySelector("#agent-backend");
const sessionForm = document.querySelector("#session-form");
const startButton = document.querySelector("#start-session");
const resetButton = document.querySelector("#reset-session");
const connectionLabel = document.querySelector("#connection-label");

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: `Request failed: ${response.status}` }));
    throw new Error(payload.error || `Request failed: ${response.status}`);
  }

  return response.json();
}

function setConnectionLabel(label) {
  connectionLabel.textContent = label;
}

function formatValue(value) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "object" && value) {
    return JSON.stringify(value, null, 2);
  }

  return String(value ?? "");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => (
    {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[character]
  ));
}

function formToPayload(form) {
  const data = new FormData(form);
  return Object.fromEntries(data.entries());
}

function populateProjectTypes() {
  projectTypeSelect.innerHTML = state.projectTypes
    .map(
      (projectType) =>
        `<option value="${escapeHtml(projectType.id)}">${escapeHtml(projectType.label)}</option>`
    )
    .join("");
}

function populateBackends() {
  backendSelect.innerHTML = state.backends
    .map(
      (backend) =>
        `<option value="${escapeHtml(backend.id)}">${escapeHtml(backend.label)}${
          backend.available ? "" : " (planned)"
        }</option>`
    )
    .join("");
}

function populateSessionSelect() {
  sessionSelect.innerHTML = state.sessions
    .map(
      (session) => `<option value="${escapeHtml(session.id)}">${escapeHtml(session.systemName)}</option>`
    )
    .join("");

  if (!state.session && state.sessions[0]) {
    state.session = state.sessions[0];
  }

  if (state.session) {
    sessionSelect.value = state.session.id;
  }
}

function populateSyntheticUsers() {
  const selectedType = projectTypeSelect.value || state.projectTypes[0]?.id;
  const scenarios = state.syntheticUsers.filter((scenario) => scenario.projectType === selectedType);

  syntheticUserSelect.innerHTML = ['<option value="">Custom session</option>']
    .concat(
      scenarios.map(
        (scenario) =>
          `<option value="${escapeHtml(scenario.id)}">${escapeHtml(scenario.label)} · ${escapeHtml(
            scenario.complexity
          )}</option>`
      )
    )
    .join("");
}

function applySyntheticScenario() {
  const selectedScenario = state.syntheticUsers.find((scenario) => scenario.id === syntheticUserSelect.value);
  if (!selectedScenario) {
    return;
  }

  document.querySelector("#system-name").value = selectedScenario.systemName;
  document.querySelector("#desired-outcome").value = selectedScenario.desiredOutcome;
  document.querySelector("#constraints").value = selectedScenario.constraints.join("\n");
  document.querySelector("#functions-or-services").value = selectedScenario.functionsOrServices.join("\n");
  document.querySelector("#project-type").value = selectedScenario.projectType;
}

function renderSummary() {
  const title = document.querySelector("#session-title");
  const summaryGrid = document.querySelector("#summary-grid");
  const protocolStrip = document.querySelector("#protocol-strip");

  if (!state.session) {
    title.textContent = "No session selected";
    summaryGrid.innerHTML = "";
    protocolStrip.innerHTML = "";
    return;
  }

  title.textContent = state.session.systemName;
  const cards = [
    ["Project type", state.session.summary.projectType],
    ["Backend", state.session.summary.agentBackendId],
    ["Status", state.session.status],
    ["Overall progress", `${state.session.summary.overallProgress}%`],
    ["Completed items", `${state.session.summary.completedItems}/${state.session.summary.totalItems}`],
    ["Active roles", state.session.summary.activeRoles]
  ];

  summaryGrid.innerHTML = cards
    .map(
      ([label, value]) => `
        <article class="summary-card" data-testid="summary-card">
          <p>${escapeHtml(label)}</p>
          <strong>${escapeHtml(value)}</strong>
        </article>
      `
    )
    .join("");

  protocolStrip.innerHTML = state.workflowProtocol
    .map(
      (role) => `
        <div class="protocol-pill" data-testid="protocol-pill">
          <span>${escapeHtml(role.label)}</span>
          <small>${escapeHtml(role.objective)}</small>
        </div>
      `
    )
    .join("");
}

function roleLabel(roleId) {
  return state.workflowProtocol.find((role) => role.id === roleId)?.label || roleId || "Idle";
}

function renderOverview() {
  const container = document.querySelector("#overview-board");
  if (!state.session) {
    container.innerHTML = "";
    return;
  }

  const activeItem =
    state.session.items.find((item) => item.id === state.session.currentItemId) ||
    state.session.items.find((item) => item.status === "active") ||
    null;
  const nextQueuedItem =
    state.session.items.find((item) => item.status === "queued") ||
    state.session.items.find((item) => item.id !== activeItem?.id && item.status !== "complete") ||
    null;
  const activeRole = activeItem?.roles.find((role) => role.status === "running") || null;
  const activeRoleIndex = activeItem && activeRole
    ? activeItem.roles.findIndex((role) => role.role === activeRole.role)
    : -1;
  const nextRole =
    (activeItem && activeRoleIndex >= 0
      ? activeItem.roles.slice(activeRoleIndex + 1).find((role) => role.status !== "complete")
      : null) ||
    activeItem?.roles.find((role) => role.status !== "complete") ||
    nextQueuedItem?.roles.find((role) => role.status !== "complete") ||
    null;
  const latestEvent = state.session.events[state.session.events.length - 1] || null;
  const focusValue = activeItem
    ? activeItem.title
    : state.session.status === "draft"
      ? "Ready to start"
      : state.session.status === "complete"
        ? "Plan complete"
        : state.session.status;
  const focusDetail = activeItem
    ? activeRole
      ? `${roleLabel(activeRole.role)} is running on work item ${activeItem.order}.`
      : `${activeItem.status} · ${activeItem.progress}% complete`
    : state.session.status === "draft"
      ? nextQueuedItem
        ? `Next queued item: ${nextQueuedItem.title}`
        : "Create a session to begin orchestration."
      : state.session.status === "complete"
        ? "All work items completed the strict role sequence."
        : "No active work item is currently running.";
  const cards = [
    {
      label: "Current focus",
      value: focusValue,
      detail: focusDetail
    },
    {
      label: "Next handoff",
      value: nextRole ? roleLabel(nextRole.role) : "Plan complete",
      detail: nextQueuedItem
        ? `Next queued item: ${nextQueuedItem.title}`
        : activeItem
          ? `Current branch plan: ${activeItem.branch.name}`
          : "No queued work."
    },
    {
      label: "Plan health",
      value: `${state.session.summary.completedItems}/${state.session.summary.totalItems} complete`,
      detail: `${state.session.status} · ${state.session.summary.activeRoles} active roles · ${
        state.session.summary.overallProgress
      }% overall progress`
    },
    {
      label: "Latest event",
      value: latestEvent?.type || "Waiting",
      detail: latestEvent?.message || "No orchestration events yet."
    }
  ];

  const railMarkup = state.session.items
    .map((item) => {
      const currentRole = item.roles.find((role) => role.status === "running");
      return `
        <article class="overview-node ${item.status}" data-testid="overview-node">
          <header>
            <p class="work-item-order">Item ${escapeHtml(item.order)}</p>
            <strong>${escapeHtml(item.progress)}%</strong>
          </header>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.goal)}</p>
          <small>${escapeHtml(currentRole ? roleLabel(currentRole.role) : item.status)}</small>
        </article>
      `;
    })
    .join("");

  container.innerHTML = `
    <div class="overview-grid">
      ${cards
        .map(
          (card) => `
            <article class="overview-card" data-testid="overview-card">
              <p>${escapeHtml(card.label)}</p>
              <strong>${escapeHtml(card.value)}</strong>
              <small>${escapeHtml(card.detail)}</small>
            </article>
          `
        )
        .join("")}
    </div>
    <div class="overview-rail">
      ${railMarkup}
    </div>
  `;
}

function renderWorkItems() {
  const container = document.querySelector("#work-items");
  if (!state.session) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = state.session.items
    .map((item) => {
      const roleMarkup = item.roles
        .map(
          (role) => `
            <li class="role-chip role-${role.status}">
              <span>${escapeHtml(role.label)}</span>
              <small>${escapeHtml(role.status)}</small>
            </li>
          `
        )
        .join("");

      return `
        <article class="work-item ${item.status}" data-testid="work-item">
          <header>
            <div>
              <p class="work-item-order">Work item ${escapeHtml(item.order)}</p>
              <h3>${escapeHtml(item.title)}</h3>
            </div>
            <strong>${escapeHtml(item.progress)}%</strong>
          </header>
          <p>${escapeHtml(item.goal)}</p>
          <div class="progress-track">
            <span class="progress-bar" style="width:${item.progress}%"></span>
          </div>
          <p class="mono">${escapeHtml(item.branch.command)}</p>
          <p class="mono">${escapeHtml(item.workspace.command || "Workspace not prepared yet.")}</p>
          <ul class="role-list">${roleMarkup}</ul>
        </article>
      `;
    })
    .join("");
}

function renderArtifacts() {
  const container = document.querySelector("#artifact-view");
  if (!state.session) {
    container.innerHTML = "";
    return;
  }

  const activeItem =
    state.session.items.find((item) => item.id === state.session.currentItemId) || state.session.items[0];

  const artifactMarkup = Object.entries(activeItem.stageArtifacts)
    .map(([roleId, artifact]) => {
      if (!artifact) {
        return `
          <article class="artifact-card artifact-empty">
            <h3>${escapeHtml(roleId)}</h3>
            <p>No structured handoff yet.</p>
          </article>
        `;
      }

      return `
        <article class="artifact-card">
          <h3>${escapeHtml(artifact.title)}</h3>
          <p>${escapeHtml(artifact.summary)}</p>
          <pre>${escapeHtml(formatValue(artifact.data))}</pre>
        </article>
      `;
    })
    .join("");

  container.innerHTML = `
    <div class="artifact-intro">
      <h3 data-testid="artifact-item-title">${escapeHtml(activeItem.title)}</h3>
      <p>${escapeHtml(activeItem.goal)}</p>
    </div>
    ${artifactMarkup}
  `;
}

function renderPrPlan() {
  const container = document.querySelector("#pr-plan");
  if (!state.session) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = state.session.artifacts.incrementalPrPlan
    .map(
      (entry) => `
        <article class="plan-card" data-testid="pr-plan-entry">
          <div>
            <p class="work-item-order">PR ${escapeHtml(entry.sequence)}</p>
            <h3>${escapeHtml(entry.prTitle)}</h3>
          </div>
          <p class="mono">${escapeHtml(entry.branchName)}</p>
          <p>${escapeHtml(entry.requiredRoles.join(" -> "))}</p>
        </article>
      `
    )
    .join("");
}

function renderEvents() {
  const container = document.querySelector("#event-feed");
  if (!state.session) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = state.session.events
    .slice()
    .reverse()
    .map(
      (event) => `
        <article class="event-card" data-testid="event-entry">
          <div class="event-meta">
            <strong>#${escapeHtml(event.sequence)}</strong>
            <span>${escapeHtml(event.type)}</span>
            <span>${escapeHtml(new Date(event.createdAt).toLocaleTimeString())}</span>
          </div>
          <p>${escapeHtml(event.message || "No message")}</p>
        </article>
      `
    )
    .join("");
}

function renderCompetitionBoard() {
  const container = document.querySelector("#competition-board");
  const latestCompetition = state.competitionResults[0];
  const latestExperiment = state.experimentResults[0];

  if (!latestCompetition && !latestExperiment) {
    container.innerHTML = `
      <article class="artifact-card artifact-empty">
        <h3>No competition artifacts yet</h3>
        <p>Run a live tournament to populate benchmark, league, and season standings.</p>
      </article>
    `;
    return;
  }

  const benchmarkMarkup = latestCompetition
    ? `
      <article class="competition-card">
        <p class="work-item-order">Latest benchmark</p>
        <h3>${escapeHtml(latestCompetition.id)}</h3>
        <p>${escapeHtml(latestCompetition.benchmark.name)}</p>
        <ul class="leaderboard-list">
          ${(latestCompetition.summary || [])
            .slice(0, 4)
            .map(
              (entry) =>
                `<li><strong>${escapeHtml(entry.label)}</strong><span>${escapeHtml(
                  `${Math.round(entry.resolvedRate * 100)}% resolved · ${entry.meanTimeToCompletionSeconds}s mean`
                )}</span></li>`
            )
            .join("")}
        </ul>
      </article>
    `
    : "";

  const leagueMarkup = latestExperiment
    ? `
      <article class="competition-card">
        <p class="work-item-order">Latest tournament</p>
        <h3>${escapeHtml(latestExperiment.batchId)}</h3>
        <p>${escapeHtml(latestExperiment.league?.style?.label || "League")} · personas ${
          latestExperiment.enablePersonas ? "on" : "off"
        }</p>
        <ul class="leaderboard-list">
          ${(latestExperiment.league?.standings || [])
            .slice(0, 4)
            .map((entry) => {
              const score =
                entry.totalScore ??
                entry.finalScore ??
                entry.penaltyMinutes ??
                entry.totalTimeSeconds ??
                entry.solved ??
                0;
              return `<li><strong>${escapeHtml(entry.team)}</strong><span>${escapeHtml(score)}</span></li>`;
            })
            .join("")}
        </ul>
      </article>
    `
    : "";

  const seasonMarkup = latestExperiment?.season?.overallStandings?.length
    ? `
      <article class="competition-card">
        <p class="work-item-order">Grand circuit</p>
        <h3>${escapeHtml(latestExperiment.season.circuitName)}</h3>
        <ul class="leaderboard-list">
          ${latestExperiment.season.overallStandings
            .slice(0, 4)
            .map(
              (entry) =>
                `<li><strong>${escapeHtml(entry.team)}</strong><span>${escapeHtml(
                  `${entry.seasonPoints} pts · ${entry.eventWins} wins`
                )}</span></li>`
            )
            .join("")}
        </ul>
      </article>
    `
    : "";

  const highlightsMarkup = latestExperiment?.league?.highlights?.length
    ? `
      <article class="competition-card competition-highlights">
        <p class="work-item-order">Highlights</p>
        <h3>Live readout</h3>
        <ul class="highlight-list">
          ${latestExperiment.league.highlights
            .map((highlight) => `<li>${escapeHtml(highlight)}</li>`)
            .join("")}
        </ul>
      </article>
    `
    : "";

  container.innerHTML = [benchmarkMarkup, leagueMarkup, seasonMarkup, highlightsMarkup].filter(Boolean).join("");
}

function render() {
  renderSummary();
  renderOverview();
  renderWorkItems();
  renderArtifacts();
  renderPrPlan();
  renderEvents();
  renderCompetitionBoard();
}

async function refreshSessions(preferredSessionId = state.session?.id) {
  const payload = await fetchJson("/api/sessions");
  state.sessions = payload.sessions;
  state.session = state.sessions.find((session) => session.id === preferredSessionId) || state.sessions[0] || null;
  populateSessionSelect();
  render();
  if (state.session) {
    connectToSession(state.session.id);
  }
}

async function loadSession(sessionId) {
  const payload = await fetchJson(`/api/sessions/${sessionId}`);
  state.session = payload.session;
  render();
}

async function refreshCompetitionBoard() {
  const [competitionData, experimentData] = await Promise.all([
    fetchJson("/api/competition/results"),
    fetchJson("/api/experiments/results")
  ]);

  state.competitionResults = competitionData.results;
  state.experimentResults = experimentData.results;
  renderCompetitionBoard();
}

function connectToSession(sessionId) {
  if (state.eventSource) {
    state.eventSource.close();
  }

  const eventSource = new EventSource(`/api/sessions/${sessionId}/events`);
  state.eventSource = eventSource;

  eventSource.onopen = () => setConnectionLabel("Live");
  eventSource.onerror = () => setConnectionLabel("Reconnecting");
  eventSource.addEventListener("progress", async () => {
    await loadSession(sessionId);
    setConnectionLabel("Live");
  });
}

async function initialize() {
  const [projectData, backendData] = await Promise.all([
    fetchJson("/api/project-types"),
    fetchJson("/api/backends")
  ]);

  state.projectTypes = projectData.projectTypes;
  state.syntheticUsers = projectData.syntheticUsers;
  state.workflowProtocol = projectData.workflowProtocol;
  state.backends = backendData.backends;

  populateProjectTypes();
  populateBackends();
  populateSyntheticUsers();
  await refreshSessions();
  await refreshCompetitionBoard();
  window.setInterval(() => {
    refreshCompetitionBoard().catch((error) => setConnectionLabel(error.message));
  }, 15000);
}

projectTypeSelect.addEventListener("change", () => {
  populateSyntheticUsers();
});

syntheticUserSelect.addEventListener("change", applySyntheticScenario);

sessionSelect.addEventListener("change", async (event) => {
  await loadSession(event.target.value);
  connectToSession(event.target.value);
});

startButton.addEventListener("click", async () => {
  if (!state.session) {
    return;
  }

  await fetchJson(`/api/sessions/${state.session.id}/start`, { method: "POST" });
  await loadSession(state.session.id);
});

resetButton.addEventListener("click", async () => {
  if (!state.session) {
    return;
  }

  await fetchJson(`/api/sessions/${state.session.id}/reset`, { method: "POST" });
  await loadSession(state.session.id);
});

sessionForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = formToPayload(sessionForm);
  const response = await fetchJson("/api/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  await refreshSessions(response.session.id);
});

initialize().catch((error) => {
  setConnectionLabel(error.message);
});
