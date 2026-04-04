import test from "node:test";
import assert from "node:assert/strict";
import { WorkspaceService } from "../src/workspace-service.js";

test("WorkspaceService previews worktree preparation in plan-only mode", async () => {
  const service = new WorkspaceService({
    repoRoot: "/repo",
    gitServiceFactory: () => ({
      isRepository: async () => true,
      previewPrepareWorktree: () => "git worktree add -b factory/plan /repo/worktrees/factory-plan main"
    })
  });

  const result = await service.prepareWorkspace(
    { branchMode: "plan-only" },
    { branch: { name: "factory/plan", base: "main" } }
  );

  assert.equal(result.previewOnly, true);
  assert.equal(result.mode, "shared-repo");
  assert.match(result.command, /Preview only/);
});

test("WorkspaceService prepares a git worktree in create-local mode", async () => {
  const service = new WorkspaceService({
    repoRoot: "/repo",
    gitServiceFactory: () => ({
      isRepository: async () => true,
      previewPrepareWorktree: () => "git worktree add -b factory/branch /repo/worktrees/factory-branch main",
      prepareWorktree: async () => ({
        created: true,
        reused: false,
        path: "/repo/.code-factory/workspaces/factorybranch",
        command: "git worktree add -b factory/branch /repo/.code-factory/workspaces/factorybranch main"
      })
    })
  });

  const result = await service.prepareWorkspace(
    { branchMode: "create-local" },
    { branch: { name: "factory/branch", base: "main" } }
  );

  assert.equal(result.previewOnly, false);
  assert.equal(result.mode, "git-worktree");
  assert.equal(result.prepared, true);
  assert.match(result.command, /git worktree add/);
});
