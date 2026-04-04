const state = {
  sessions: [],
  session: null,
  projectTypes: [],
  syntheticUsers: [],
  workflowProtocol: [],
  backends: [],
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

function formToPayload(form) {
  const data = new FormData(form);
  return Object.fromEntries(data.entries());
}

function populateProjectTypes() {
  projectTypeSelect.innerHTML = state.projectTypes
    .map((projectType) => `<option value="${projectType.id}">${projectType.label}</option>`)
    .join("");
}

function populateBackends() {
  backendSelect.innerHTML = state.backends
    .map(
      (backend) =>
        `<option value="${backend.id}">${backend.label}${backend.available ? "" : " (planned)"}</option>`
    )
    .join("");
}

function populateSessionSelect() {
  sessionSelect.innerHTML = state.sessions
    .map((session) => `<option value="${session.id}">${session.systemName}</option>`)
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
          `<option value="${scenario.id}">${scenario.label} · ${scenario.complexity}</option>`
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
          <p>${label}</p>
          <strong>${value}</strong>
        </article>
      `
    )
    .join("");

  protocolStrip.innerHTML = state.workflowProtocol
    .map(
      (role) => `
        <div class="protocol-pill" data-testid="protocol-pill">
          <span>${role.label}</span>
          <small>${role.objective}</small>
        </div>
      `
    )
    .join("");
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
              <span>${role.label}</span>
              <small>${role.status}</small>
            </li>
          `
        )
        .join("");

      return `
        <article class="work-item ${item.status}" data-testid="work-item">
          <header>
            <div>
              <p class="work-item-order">Work item ${item.order}</p>
              <h3>${item.title}</h3>
            </div>
            <strong>${item.progress}%</strong>
          </header>
          <p>${item.goal}</p>
          <div class="progress-track">
            <span class="progress-bar" style="width:${item.progress}%"></span>
          </div>
          <p class="mono">${item.branch.command}</p>
          <p class="mono">${item.workspace.command || "Workspace not prepared yet."}</p>
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
            <h3>${roleId}</h3>
            <p>No structured handoff yet.</p>
          </article>
        `;
      }

      return `
        <article class="artifact-card">
          <h3>${artifact.title}</h3>
          <p>${artifact.summary}</p>
          <pre>${formatValue(artifact.data)}</pre>
        </article>
      `;
    })
    .join("");

  container.innerHTML = `
    <div class="artifact-intro">
      <h3 data-testid="artifact-item-title">${activeItem.title}</h3>
      <p>${activeItem.goal}</p>
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
            <p class="work-item-order">PR ${entry.sequence}</p>
            <h3>${entry.prTitle}</h3>
          </div>
          <p class="mono">${entry.branchName}</p>
          <p>${entry.requiredRoles.join(" -> ")}</p>
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
            <strong>#${event.sequence}</strong>
            <span>${event.type}</span>
            <span>${new Date(event.createdAt).toLocaleTimeString()}</span>
          </div>
          <p>${event.message || "No message"}</p>
        </article>
      `
    )
    .join("");
}

function render() {
  renderSummary();
  renderWorkItems();
  renderArtifacts();
  renderPrPlan();
  renderEvents();
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
