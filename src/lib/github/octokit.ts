import type { GitHubService } from "./types";

/**
 * Octokit-backed adapter — the place to wire real GitHub access.
 *
 * Intentionally NOT implemented in the MVP so the project installs and
 * runs with zero credentials. To enable it:
 *
 *   1. npm i @octokit/rest @octokit/auth-app
 *   2. Set GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY, GITHUB_CLIENT_ID,
 *      GITHUB_CLIENT_SECRET and RANKFORGE_MODE=live.
 *   3. Replace each `notImplemented()` below with the calls sketched in
 *      the comments — e.g.
 *
 *        const octokit = new Octokit({
 *          authStrategy: createAppAuth,
 *          auth: { appId, privateKey, installationId },
 *        });
 *        const { data } = await octokit.rest.repos.listForAuthenticatedUser();
 *
 *   The mapping from Octokit payloads → RankForge `Repository` /
 *   `PullRequest` types belongs here so the rest of the app stays clean.
 */
function notImplemented(method: string): never {
  throw new Error(
    `OctokitGitHubService.${method} is not implemented yet. ` +
      `Install @octokit/rest, set RANKFORGE_MODE=live and wire credentials. ` +
      `See src/lib/github/octokit.ts.`,
  );
}

export class OctokitGitHubService implements GitHubService {
  // listForAuthenticatedUser → map to Repository[]
  async listRepos() {
    return notImplemented("listRepos");
  }
  // repos.get → map to Repository
  async getRepo() {
    return notImplemented("getRepo");
  }
  // git.createRef
  async createBranch() {
    return notImplemented("createBranch");
  }
  // git.createTree + git.createCommit + git.updateRef
  async commitChanges() {
    return notImplemented("commitChanges");
  }
  // pulls.create → map to PullRequest
  async openPullRequest() {
    return notImplemented("openPullRequest");
  }
  // pulls.list → map to PullRequest[]
  async getPullRequests() {
    return notImplemented("getPullRequests");
  }
}
