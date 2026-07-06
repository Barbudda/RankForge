import type { PullRequest, Repository } from "@/types";

/**
 * The GitHub surface RankForge depends on. Both a mock and an
 * Octokit-backed adapter implement this — the rest of the app only ever
 * talks to the interface, never to Octokit directly.
 */

export interface CreateBranchInput {
  repoFullName: string;
  fromBranch: string;
  newBranch: string;
}

export interface CommitFile {
  path: string;
  /** Full new file contents (the adapter computes the blob). */
  content: string;
}

export interface CommitChangesInput {
  repoFullName: string;
  branch: string;
  message: string;
  files: CommitFile[];
}

export interface OpenPullRequestInput {
  repoFullName: string;
  head: string;
  base: string;
  title: string;
  body: string;
  draft?: boolean;
}

export interface GitHubService {
  /** Repositories the installation can see. */
  listRepos(): Promise<Repository[]>;
  getRepo(fullName: string): Promise<Repository | null>;
  createBranch(input: CreateBranchInput): Promise<{ ref: string }>;
  commitChanges(input: CommitChangesInput): Promise<{ sha: string }>;
  openPullRequest(input: OpenPullRequestInput): Promise<PullRequest>;
  getPullRequests(repoFullName: string): Promise<PullRequest[]>;
}
