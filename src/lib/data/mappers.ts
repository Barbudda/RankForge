/**
 * Row ↔ domain mappers between Supabase (snake_case columns, jsonb blobs) and
 * the strict domain model in src/types. Reads use to*(); writes use from*()
 * which stamp the owner's user_id (enforced by RLS WITH CHECK).
 */
import type {
  AgentMode,
  AgentSettings,
  Audit,
  CategoryScore,
  CrawlSummary,
  FileSuggestion,
  FixSuggestion,
  Framework,
  FrameworkSignal,
  AffectedUrl,
  PullRequest,
  PullRequestFile,
  Repository,
  SeoCategory,
  SeoIssue,
} from "@/types";

// ── Row shapes (only the columns we read) ───────────────────────────────
export interface RepoRow {
  id: string;
  name: string;
  owner: string;
  full_name: string;
  framework: string;
  default_branch: string;
  production_url: string;
  pages: number;
  score: number;
  score_delta: number;
  open_issues: number;
  open_pull_requests: number;
  private: boolean;
  last_audit_at: string | null;
  connected_at: string;
  detection_confidence: number;
  agent_level: string;
}

export interface AuditRow {
  id: string;
  repo_id: string;
  score: number;
  previous_score: number | null;
  status: Audit["status"];
  created_at: string;
  duration_ms: number;
  total_issues: number;
  categories: CategoryScore[];
  crawl: CrawlSummary;
  framework_signals: FrameworkSignal[];
}

export interface IssueRow {
  id: string;
  repo_id: string;
  audit_id: string | null;
  title: string;
  description: string;
  category: string;
  impact: SeoIssue["impact"];
  effort: SeoIssue["effort"];
  risk: SeoIssue["risk"];
  confidence: number;
  status: SeoIssue["status"];
  affected_urls: AffectedUrl[];
  evidence: string;
  suggested_fix: FixSuggestion;
  files: FileSuggestion[];
  can_auto_fix: boolean;
  created_at: string;
}

export interface PrRow {
  id: string;
  repo_id: string;
  issue_ids: string[];
  number: number;
  title: string;
  description: string;
  branch_name: string;
  base_branch: string;
  status: PullRequest["status"];
  files: PullRequestFile[];
  additions: number;
  deletions: number;
  checklist: { label: string; done: boolean }[];
  expected_impact: string;
  risk: PullRequest["risk"];
  url: string | null;
  created_at: string;
}

export interface SettingsRow {
  mode: string;
  weekly_audit: boolean;
  max_prs_per_week: number;
  allowed_categories: SeoCategory[];
  excluded_paths: string[];
}

// ── Read mappers (row → domain) ─────────────────────────────────────────
export function toRepository(r: RepoRow): Repository {
  return {
    id: r.id,
    name: r.name,
    owner: r.owner,
    fullName: r.full_name,
    framework: r.framework as Framework,
    defaultBranch: r.default_branch,
    productionUrl: r.production_url,
    pages: r.pages,
    score: r.score,
    scoreDelta: r.score_delta,
    openIssues: r.open_issues,
    openPullRequests: r.open_pull_requests,
    private: r.private,
    lastAuditAt: r.last_audit_at,
    connectedAt: r.connected_at,
    detectionConfidence: r.detection_confidence,
    agentLevel: r.agent_level as AgentMode,
  };
}

export function toAudit(r: AuditRow): Audit {
  return {
    id: r.id,
    repoId: r.repo_id,
    score: r.score,
    previousScore: r.previous_score,
    status: r.status,
    createdAt: r.created_at,
    durationMs: r.duration_ms,
    totalIssues: r.total_issues,
    categories: r.categories,
    crawl: r.crawl,
    frameworkSignals: r.framework_signals,
  };
}

export function toIssue(r: IssueRow): SeoIssue {
  return {
    id: r.id,
    repoId: r.repo_id,
    auditId: r.audit_id ?? "",
    title: r.title,
    description: r.description,
    category: r.category as SeoCategory,
    impact: r.impact,
    effort: r.effort,
    risk: r.risk,
    confidence: r.confidence,
    status: r.status,
    affectedUrls: r.affected_urls,
    evidence: r.evidence,
    suggestedFix: r.suggested_fix,
    files: r.files,
    canAutoFix: r.can_auto_fix,
    createdAt: r.created_at,
  };
}

export function toPullRequest(r: PrRow): PullRequest {
  return {
    id: r.id,
    repoId: r.repo_id,
    issueIds: r.issue_ids,
    number: r.number,
    title: r.title,
    description: r.description,
    branchName: r.branch_name,
    baseBranch: r.base_branch,
    status: r.status,
    files: r.files,
    additions: r.additions,
    deletions: r.deletions,
    checklist: r.checklist,
    expectedImpact: r.expected_impact,
    risk: r.risk,
    url: r.url,
    createdAt: r.created_at,
  };
}

export function toAgentSettings(r: SettingsRow): AgentSettings {
  return {
    mode: r.mode as AgentMode,
    weeklyAudit: r.weekly_audit,
    maxPrsPerWeek: r.max_prs_per_week,
    allowedCategories: r.allowed_categories,
    excludedPaths: r.excluded_paths,
  };
}

// ── Write mappers (domain → row, owner-stamped) ─────────────────────────
export function fromRepository(r: Repository, userId: string) {
  return {
    id: r.id,
    user_id: userId,
    name: r.name,
    owner: r.owner,
    full_name: r.fullName,
    framework: r.framework,
    default_branch: r.defaultBranch,
    production_url: r.productionUrl,
    pages: r.pages,
    score: r.score,
    score_delta: r.scoreDelta,
    open_issues: r.openIssues,
    open_pull_requests: r.openPullRequests,
    private: r.private,
    last_audit_at: r.lastAuditAt,
    connected_at: r.connectedAt,
    detection_confidence: r.detectionConfidence,
    agent_level: r.agentLevel,
  };
}

export function fromAudit(a: Audit, userId: string) {
  return {
    id: a.id,
    user_id: userId,
    repo_id: a.repoId,
    score: a.score,
    previous_score: a.previousScore,
    status: a.status,
    created_at: a.createdAt,
    duration_ms: a.durationMs,
    total_issues: a.totalIssues,
    categories: a.categories,
    crawl: a.crawl,
    framework_signals: a.frameworkSignals,
  };
}

export function fromIssue(i: SeoIssue, userId: string) {
  return {
    id: i.id,
    user_id: userId,
    repo_id: i.repoId,
    audit_id: i.auditId || null,
    title: i.title,
    description: i.description,
    category: i.category,
    impact: i.impact,
    effort: i.effort,
    risk: i.risk,
    confidence: i.confidence,
    status: i.status,
    affected_urls: i.affectedUrls,
    evidence: i.evidence,
    suggested_fix: i.suggestedFix,
    files: i.files,
    can_auto_fix: i.canAutoFix,
    created_at: i.createdAt,
  };
}

export function fromPullRequest(p: PullRequest, userId: string) {
  return {
    id: p.id,
    user_id: userId,
    repo_id: p.repoId,
    issue_ids: p.issueIds,
    number: p.number,
    title: p.title,
    description: p.description,
    branch_name: p.branchName,
    base_branch: p.baseBranch,
    status: p.status,
    files: p.files,
    additions: p.additions,
    deletions: p.deletions,
    checklist: p.checklist,
    expected_impact: p.expectedImpact,
    risk: p.risk,
    url: p.url,
    created_at: p.createdAt,
  };
}

export function fromAgentSettings(s: AgentSettings, userId: string) {
  return {
    user_id: userId,
    mode: s.mode,
    weekly_audit: s.weeklyAudit,
    max_prs_per_week: s.maxPrsPerWeek,
    allowed_categories: s.allowedCategories,
    excluded_paths: s.excludedPaths,
    updated_at: new Date().toISOString(),
  };
}
