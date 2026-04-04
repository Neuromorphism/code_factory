import path from "node:path";
import { slugify } from "./utils.js";

export class WorkspaceService {
  constructor({
    repoRoot = process.cwd(),
    workspaceRoot = path.resolve(repoRoot, ".code-factory/workspaces"),
    gitServiceFactory
  } = {}) {
    this.repoRoot = repoRoot;
    this.workspaceRoot = workspaceRoot;
    this.gitServiceFactory = gitServiceFactory;
  }

  async prepareWorkspace(session, item) {
    const git = this.gitServiceFactory();
    const isRepository = await git.isRepository();
    const workspacePath = path.join(this.workspaceRoot, slugify(item.branch.name));
    const previewCommand = git.previewPrepareWorktree(item.branch.name, {
      base: item.branch.base,
      path: workspacePath
    });

    if (!isRepository) {
      return {
        path: this.repoRoot,
        mode: "shared-repo",
        prepared: false,
        previewOnly: true,
        command: `Preview only: ${previewCommand}`
      };
    }

    if (session.branchMode !== "create-local") {
      return {
        path: this.repoRoot,
        mode: "shared-repo",
        prepared: false,
        previewOnly: true,
        command: `Preview only: ${previewCommand}`
      };
    }

    const prepared = await git.prepareWorktree(item.branch.name, {
      base: item.branch.base,
      path: workspacePath
    });

    return {
      path: prepared.path,
      mode: "git-worktree",
      prepared: prepared.created || prepared.reused,
      previewOnly: false,
      command: prepared.command
    };
  }
}
