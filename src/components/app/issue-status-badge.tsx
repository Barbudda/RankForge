import type { IssueStatus, PullRequestStatus } from "@/types";
import { Badge } from "@/components/ui/badge";

const ISSUE_STATUS: Record<
  IssueStatus,
  { label: string; tone: React.ComponentProps<typeof Badge>["tone"] }
> = {
  open: { label: "Open", tone: "amber" },
  pr_open: { label: "PR open", tone: "electric" },
  pr_merged: { label: "PR merged", tone: "violet" },
  fixed: { label: "Fixed", tone: "signal" },
  ignored: { label: "Ignored", tone: "neutral" },
};

export function IssueStatusBadge({ status }: { status: IssueStatus }) {
  const s = ISSUE_STATUS[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

const PR_STATUS: Record<
  PullRequestStatus,
  { label: string; tone: React.ComponentProps<typeof Badge>["tone"] }
> = {
  draft: { label: "Draft", tone: "neutral" },
  open: { label: "Open", tone: "electric" },
  merged: { label: "Merged", tone: "violet" },
  closed: { label: "Closed", tone: "danger" },
  simulated: { label: "Simulated", tone: "cyan" },
};

export function PrStatusBadge({ status }: { status: PullRequestStatus }) {
  const s = PR_STATUS[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}
