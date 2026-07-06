import type { PullRequest } from "@/types";
import {
  mockRepositories,
  getPullRequestsForRepo,
} from "@/lib/sample";
import type {
  CommitChangesInput,
  CreateBranchInput,
  GitHubService,
  OpenPullRequestInput,
} from "./types";

/** Fully working in-memory GitHub adapter backed by the mock fixtures. */
export class MockGitHubService implements GitHubService {
  async listRepos() {
    return mockRepositories;
  }

  async getRepo(fullName: string) {
    return mockRepositories.find((r) => r.fullName === fullName) ?? null;
  }

  async createBranch(input: CreateBranchInput) {
    // No-op in mock mode; pretend the ref was created.
    return { ref: `refs/heads/${input.newBranch}` };
  }

  async commitChanges(input: CommitChangesInput) {
    // Deterministic pseudo-sha so the UI has something to show.
    const sha = `mock${input.files.length}${input.branch.length}`.padEnd(7, "0");
    return { sha };
  }

  async openPullRequest(input: OpenPullRequestInput): Promise<PullRequest> {
    const repo = await this.getRepo(input.repoFullName);
    return {
      id: `pr_mock_${Date.now()}`,
      repoId: repo?.id ?? "repo_unknown",
      issueIds: [],
      number: 0,
      title: input.title,
      description: input.body,
      branchName: input.head,
      baseBranch: input.base,
      status: input.draft ? "draft" : "simulated",
      files: [],
      additions: 0,
      deletions: 0,
      checklist: [],
      expectedImpact: "—",
      risk: "low",
      url: null,
      createdAt: new Date().toISOString(),
    };
  }

  async getPullRequests(repoFullName: string) {
    const repo = await this.getRepo(repoFullName);
    return repo ? getPullRequestsForRepo(repo.id) : [];
  }
}
