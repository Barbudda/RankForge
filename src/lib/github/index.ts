import { canUseLiveGitHub } from "@/lib/config";
import type { GitHubService } from "./types";
import { MockGitHubService } from "./mock";
import { OctokitGitHubService } from "./octokit";

export type { GitHubService } from "./types";

let instance: GitHubService | null = null;

/**
 * Returns the active GitHub adapter. Mock by default; the Octokit
 * adapter only when live mode is configured with valid credentials.
 */
export function getGitHubService(): GitHubService {
  if (!instance) {
    instance = canUseLiveGitHub
      ? new OctokitGitHubService()
      : new MockGitHubService();
  }
  return instance;
}
