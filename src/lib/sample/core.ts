import type { Repository } from "@/types";

// Sample repositories — demo content, loaded only when the test dataset is on
// (Dev mode). Production starts empty. See src/lib/data and src/lib/account.
export const mockRepositories: Repository[] = [
  {
    id: "repo_acme",
    name: "acme-saas-web",
    owner: "acme",
    fullName: "acme/acme-saas-web",
    framework: "nextjs",
    defaultBranch: "main",
    productionUrl: "https://acme.com",
    pages: 142,
    score: 71,
    scoreDelta: +6,
    openIssues: 9,
    openPullRequests: 2,
    private: true,
    lastAuditAt: "2026-06-23T08:42:00.000Z",
    connectedAt: "2026-04-02T10:00:00.000Z",
    detectionConfidence: 98,
    agentLevel: "draft_pr",
  },
  {
    id: "repo_northstar",
    name: "northstar-docs",
    owner: "northstar",
    fullName: "northstar/northstar-docs",
    framework: "astro",
    defaultBranch: "main",
    productionUrl: "https://docs.northstar.dev",
    pages: 386,
    score: 64,
    scoreDelta: +3,
    openIssues: 7,
    openPullRequests: 1,
    private: false,
    lastAuditAt: "2026-06-22T17:10:00.000Z",
    connectedAt: "2026-03-18T09:30:00.000Z",
    detectionConfidence: 95,
    agentLevel: "suggest",
  },
  {
    id: "repo_studio",
    name: "studio-landing",
    owner: "northstar",
    fullName: "northstar/studio-landing",
    framework: "nuxt",
    defaultBranch: "main",
    productionUrl: "https://studio.northstar.dev",
    pages: 28,
    score: 82,
    scoreDelta: +1,
    openIssues: 4,
    openPullRequests: 1,
    private: false,
    lastAuditAt: "2026-06-21T12:05:00.000Z",
    connectedAt: "2026-05-09T14:20:00.000Z",
    detectionConfidence: 92,
    agentLevel: "auto_low_risk",
  },
];

export function getRepository(id: string): Repository | undefined {
  return mockRepositories.find((r) => r.id === id);
}
