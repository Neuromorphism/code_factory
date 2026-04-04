import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { createSession } from "../src/plan-service.js";
import { HarnessStore } from "../src/store.js";
import { cleanupTempDir, makeTempDir } from "./helpers.js";

test("HarnessStore persists and hydrates sessions with sequenced events", () => {
  const directory = makeTempDir();

  try {
    const storagePath = path.join(directory, "sessions.json");
    const store = new HarnessStore({ storagePath });
    const session = store.createSession(createSession({ systemName: "Persistent harness" }));

    store.publish({
      sessionId: session.id,
      type: "custom-event",
      message: "Stored in sequence."
    });

    const reloaded = new HarnessStore({ storagePath });
    const restored = reloaded.getSession(session.id);

    assert.equal(restored.systemName, "Persistent harness");
    assert.equal(restored.events.at(-1).sequence, 2);
    assert.equal(restored.events.at(-1).message, "Stored in sequence.");
  } finally {
    cleanupTempDir(directory);
  }
});
