import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

function stableStringify(value) {
  return JSON.stringify(value, Object.keys(value || {}).sort());
}

export async function loadCandidateFunction(challenge, code) {
  const directory = mkdtempSync(path.join(os.tmpdir(), "code-factory-candidate-"));
  const filePath = path.join(directory, `${challenge.entryFunction}.mjs`);
  const wrapped = `${code}\nexport default ${challenge.entryFunction};\n`;
  writeFileSync(filePath, wrapped, "utf8");

  try {
    const module = await import(`${pathToFileUrl(filePath)}?ts=${Date.now()}`);
    return {
      fn: module.default,
      cleanup() {
        rmSync(directory, { recursive: true, force: true });
      }
    };
  } catch (error) {
    rmSync(directory, { recursive: true, force: true });
    throw error;
  }
}

function pathToFileUrl(filePath) {
  return `file://${filePath}`;
}

export async function evaluateImplementation(challenge, code, { extraCases = [] } = {}) {
  let loaded;

  try {
    loaded = await loadCandidateFunction(challenge, code);
  } catch (error) {
    return {
      compiled: false,
      passedVisible: 0,
      passedHidden: 0,
      passedExtra: 0,
      visibleFailures: challenge.visibleCases.map((testCase) => ({
        args: testCase.args,
        error: error.message
      })),
      hiddenFailures: [],
      extraFailures: extraCases.map((testCase) => ({
        args: testCase.args,
        error: error.message
      })),
      totalVisible: challenge.visibleCases.length,
      totalHidden: challenge.hiddenCases.length,
      totalExtra: extraCases.length
    };
  }

  const visible = await runCases(challenge, loaded.fn, challenge.visibleCases);
  const hidden = await runCases(challenge, loaded.fn, challenge.hiddenCases);
  const extra = await runCases(challenge, loaded.fn, extraCases);
  loaded.cleanup();

  return {
    compiled: true,
    passedVisible: visible.successes.length,
    passedHidden: hidden.successes.length,
    passedExtra: extra.successes.length,
    visibleFailures: visible.failures,
    hiddenFailures: hidden.failures,
    extraFailures: extra.failures,
    totalVisible: challenge.visibleCases.length,
    totalHidden: challenge.hiddenCases.length,
    totalExtra: extraCases.length
  };
}

async function runCases(challenge, candidate, cases) {
  const successes = [];
  const failures = [];

  for (const testCase of cases) {
    try {
      const actual = await candidate(...testCase.args);
      const expected = challenge.reference(...testCase.args);

      if (stableStringify(actual) === stableStringify(expected)) {
        successes.push(testCase);
      } else {
        failures.push({
          args: testCase.args,
          actual,
          expected
        });
      }
    } catch (error) {
      failures.push({
        args: testCase.args,
        error: error.message
      });
    }
  }

  return { successes, failures };
}

export async function scoreAttackCases(challenge, code, cases) {
  let loaded;

  try {
    loaded = await loadCandidateFunction(challenge, code);
  } catch {
    return {
      successfulCases: [],
      failedToExecute: cases
    };
  }

  const successfulCases = [];
  const failedToExecute = [];

  for (const entry of cases) {
    try {
      const actual = await loaded.fn(...entry.args);
      const expected = challenge.reference(...entry.args);

      if (stableStringify(actual) !== stableStringify(expected)) {
        successfulCases.push({
          args: entry.args,
          why: entry.why,
          actual,
          expected
        });
      }
    } catch (error) {
      failedToExecute.push({
        args: entry.args,
        why: entry.why,
        error: error.message
      });
    }
  }

  loaded.cleanup();

  return {
    successfulCases,
    failedToExecute
  };
}
