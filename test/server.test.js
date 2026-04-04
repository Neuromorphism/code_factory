import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { createHarnessApp } from "../src/app.js";
import { cleanupTempDir, makeTempDir } from "./helpers.js";

test("createHarnessApp serves metadata, sessions, and static dashboard assets", async () => {
  const directory = makeTempDir();
  const app = createHarnessApp({
    seed: true,
    storagePath: path.join(directory, "sessions.json")
  });

  try {
    const address = await app.start(0);
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const health = await fetch(`${baseUrl}/api/health`).then((response) => response.json());
    const metadata = await fetch(`${baseUrl}/api/project-types`).then((response) => response.json());
    const competition = await fetch(`${baseUrl}/api/competition/template`).then((response) => response.json());
    const resultIndex = await fetch(`${baseUrl}/api/competition/results`).then((response) => response.json());
    const dashboardHtml = await fetch(`${baseUrl}/`).then((response) => response.text());

    assert.equal(health.ok, true);
    assert.equal(metadata.projectTypes.length, 3);
    assert.equal(competition.competition.benchmark.name, "SWE-bench Lite");
    assert.deepEqual(resultIndex.results, []);
    assert.match(dashboardHtml, /Orchestrated Delivery Harness/);
  } finally {
    await app.close();
    cleanupTempDir(directory);
  }
});
