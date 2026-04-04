import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export class GitService {
  constructor({ repoRoot = process.cwd(), exec = execFileAsync } = {}) {
    this.repoRoot = repoRoot;
    this.exec = exec;
  }

  async run(args) {
    return this.exec("git", args, { cwd: this.repoRoot });
  }

  async isRepository() {
    try {
      const { stdout } = await this.run(["rev-parse", "--is-inside-work-tree"]);
      return stdout.trim() === "true";
    } catch {
      return false;
    }
  }

  async currentBranch() {
    const { stdout } = await this.run(["branch", "--show-current"]);
    return stdout.trim();
  }

  async branchExists(name) {
    try {
      await this.run(["show-ref", "--verify", "--quiet", `refs/heads/${name}`]);
      return true;
    } catch {
      return false;
    }
  }

  previewCreateBranch(name, { base = "HEAD", checkout = false } = {}) {
    return checkout
      ? `git switch -c ${name} ${base}`
      : `git branch ${name} ${base}`;
  }

  previewPrepareWorktree(name, { base = "HEAD", path } = {}) {
    return `git worktree add -b ${name} ${path} ${base}`;
  }

  async worktreeExists(worktreePath) {
    try {
      const { stdout } = await this.run(["worktree", "list", "--porcelain"]);
      return stdout.includes(`worktree ${worktreePath}`);
    } catch {
      return existsSync(worktreePath);
    }
  }

  async createBranch(name, { base = "HEAD", checkout = false } = {}) {
    const exists = await this.branchExists(name);
    const command = this.previewCreateBranch(name, { base, checkout });

    if (exists) {
      return {
        created: false,
        exists: true,
        name,
        base,
        command
      };
    }

    const args = checkout ? ["switch", "-c", name, base] : ["branch", name, base];
    await this.run(args);

    return {
      created: true,
      exists: true,
      name,
      base,
      command
    };
  }

  async prepareWorktree(name, { base = "HEAD", path } = {}) {
    const branchExists = await this.branchExists(name);
    const worktreeExists = await this.worktreeExists(path);
    const command = branchExists
      ? `git worktree add ${path} ${name}`
      : this.previewPrepareWorktree(name, { base, path });

    if (worktreeExists) {
      return {
        created: false,
        reused: true,
        path,
        name,
        base,
        command
      };
    }

    const args = branchExists
      ? ["worktree", "add", path, name]
      : ["worktree", "add", "-b", name, path, base];
    await this.run(args);

    return {
      created: true,
      reused: false,
      path,
      name,
      base,
      command
    };
  }
}
