import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

function normalizeForComparison(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeForComparison(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, normalizeForComparison(value[key])])
    );
  }

  return value;
}

function stableStringify(value) {
  return JSON.stringify(normalizeForComparison(value));
}

function pathToFileUrl(filePath) {
  return `file://${filePath}`;
}

function cloneTestCase(testCase) {
  return {
    target: testCase?.target,
    args: structuredClone(testCase?.args ?? [])
  };
}

function wrapCandidateCode(challenge, code) {
  if (challenge.moduleExports?.length) {
    const exportsList = challenge.moduleExports.join(", ");
    return `${code}\nconst __candidate__ = { ${exportsList} };\nexport default __candidate__;\nexport { ${exportsList} };\n`;
  }

  return `${code}\nexport default ${challenge.entryFunction};\n`;
}

function getFileStem(challenge) {
  return challenge.entryFunction ?? challenge.id ?? "candidate";
}

function resolveTargetName(challenge, testCase) {
  return testCase?.target ?? challenge.entryFunction ?? challenge.moduleExports?.[0] ?? null;
}

function resolveReference(challenge, testCase) {
  const target = resolveTargetName(challenge, testCase);

  if (typeof challenge.reference === "function") {
    return challenge.reference(...(testCase?.args ?? []));
  }

  const handler = challenge.reference?.[target];
  if (typeof handler !== "function") {
    throw new Error(`Missing reference handler for target ${target}`);
  }

  return handler(...(testCase?.args ?? []));
}

export async function loadCandidateFunction(challenge, code) {
  const directory = mkdtempSync(path.join(os.tmpdir(), "code-factory-candidate-"));
  const filePath = path.join(directory, `${getFileStem(challenge)}.mjs`);
  const wrapped = wrapCandidateCode(challenge, code);
  writeFileSync(filePath, wrapped, "utf8");

  try {
    const module = await import(`${pathToFileUrl(filePath)}?ts=${Date.now()}`);
    const getTargetFunction = (testCase = {}) => {
      if (challenge.moduleExports?.length) {
        const target = resolveTargetName(challenge, testCase);
        const fn = module.default?.[target] ?? module[target];

        if (typeof fn !== "function") {
          throw new Error(`Missing candidate export ${target}`);
        }

        return fn;
      }

      return module.default;
    };

    return {
      fn: module.default,
      invoke(testCase) {
        const fn = getTargetFunction(testCase);
        return fn(...(testCase?.args ?? []));
      },
      cleanup() {
        rmSync(directory, { recursive: true, force: true });
      }
    };
  } catch (error) {
    rmSync(directory, { recursive: true, force: true });
    throw error;
  }
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
        target: resolveTargetName(challenge, testCase),
        args: testCase.args,
        error: error.message
      })),
      hiddenFailures: [],
      extraFailures: extraCases.map((testCase) => ({
        target: resolveTargetName(challenge, testCase),
        args: testCase.args,
        error: error.message
      })),
      totalVisible: challenge.visibleCases.length,
      totalHidden: challenge.hiddenCases.length,
      totalExtra: extraCases.length
    };
  }

  const visible = await runCases(challenge, loaded, challenge.visibleCases);
  const hidden = await runCases(challenge, loaded, challenge.hiddenCases);
  const extra = await runCases(challenge, loaded, extraCases);
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

async function runCases(challenge, loaded, cases) {
  const successes = [];
  const failures = [];

  for (const testCase of cases) {
    try {
      const candidateCase = cloneTestCase(testCase);
      const referenceCase = cloneTestCase(testCase);
      const actual = await loaded.invoke(candidateCase);
      const expected = resolveReference(challenge, referenceCase);

      if (stableStringify(actual) === stableStringify(expected)) {
        successes.push(testCase);
      } else {
        failures.push({
          target: resolveTargetName(challenge, testCase),
          args: testCase.args,
          actual,
          expected
        });
      }
    } catch (error) {
      failures.push({
        target: resolveTargetName(challenge, testCase),
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
      const candidateCase = cloneTestCase(entry);
      const referenceCase = cloneTestCase(entry);
      const actual = await loaded.invoke(candidateCase);
      const expected = resolveReference(challenge, referenceCase);

      if (stableStringify(actual) !== stableStringify(expected)) {
        successfulCases.push({
          target: resolveTargetName(challenge, entry),
          args: entry.args,
          why: entry.why,
          actual,
          expected
        });
      }
    } catch (error) {
      failedToExecute.push({
        target: resolveTargetName(challenge, entry),
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
