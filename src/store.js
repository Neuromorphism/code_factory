import { EventEmitter } from "node:events";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { summarizeSession } from "./plan-service.js";
import { makeId, nowIso } from "./utils.js";

export class HarnessStore {
  constructor({ storagePath = null } = {}) {
    this.sessions = new Map();
    this.events = new EventEmitter();
    this.storagePath = storagePath;
    this.hydrate();
  }

  listSessions() {
    return [...this.sessions.values()].map((session) => summarizeSession(structuredClone(session)));
  }

  createSession(session) {
    const snapshot = summarizeSession(structuredClone(session));
    this.sessions.set(snapshot.id, snapshot);
    this.persist();
    this.publish({
      sessionId: snapshot.id,
      type: "session-created",
      level: "info",
      message: `Created session for ${snapshot.systemName}.`
    });
    return this.getSession(snapshot.id);
  }

  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    return summarizeSession(structuredClone(session));
  }

  updateSession(sessionId, updater) {
    const current = this.sessions.get(sessionId);
    if (!current) {
      throw new Error(`Unknown session: ${sessionId}`);
    }

    const next = structuredClone(current);
    updater(next);
    next.updatedAt = nowIso();

    const summarized = summarizeSession(next);
    this.sessions.set(sessionId, summarized);
    this.persist();
    return this.getSession(sessionId);
  }

  replaceSession(sessionId, session) {
    const snapshot = summarizeSession(structuredClone(session));
    this.sessions.set(sessionId, snapshot);
    this.persist();
    return this.getSession(sessionId);
  }

  publish({ sessionId, itemId = null, role = null, type, level = "info", message }) {
    const session = this.sessions.get(sessionId);
    const sequence = session?.nextEventSequence ?? 1;
    const event = {
      id: makeId("event"),
      sessionId,
      itemId,
      role,
      sequence,
      type,
      level,
      message,
      createdAt: nowIso()
    };

    if (session) {
      session.events = [...session.events.slice(-199), event];
      session.nextEventSequence = sequence + 1;
      this.sessions.set(sessionId, summarizeSession(session));
      this.persist();
    }

    this.events.emit("event", event);
    return event;
  }

  onEvent(listener) {
    this.events.on("event", listener);
    return () => this.events.off("event", listener);
  }

  hydrate() {
    if (!this.storagePath || !existsSync(this.storagePath)) {
      return;
    }

    const payload = JSON.parse(readFileSync(this.storagePath, "utf8"));
    for (const session of payload.sessions ?? []) {
      this.sessions.set(session.id, summarizeSession(session));
    }
  }

  persist() {
    if (!this.storagePath) {
      return;
    }

    mkdirSync(path.dirname(this.storagePath), { recursive: true });
    writeFileSync(
      this.storagePath,
      JSON.stringify(
        {
          sessions: [...this.sessions.values()]
        },
        null,
        2
      )
    );
  }
}
