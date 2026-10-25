import { guardedFetch } from "@/lib/net/ssrf";
import type { SiteChange } from "@/lib/audit/snapshot";

/**
 * Alert delivery for monitoring: email (Resend's REST API, no SDK) and
 * webhooks (Slack, Discord, or any JSON endpoint). Everything is best-effort:
 * a failed alert never fails the check, and the check row records whether an
 * alert went out.
 *
 * Webhook URLs are user input fetched from our server, so they go through the
 * SSRF guard (public https hosts only).
 */

export type AlertLevel = "none" | "info" | "warning" | "critical";

const RANK: Record<AlertLevel, number> = { none: 0, info: 1, warning: 2, critical: 3 };

export function levelReached(level: AlertLevel, min: Exclude<AlertLevel, "none">): boolean {
  return RANK[level] >= RANK[min];
}

export interface AlertContent {
  siteName: string;
  siteUrl: string;
  level: AlertLevel;
  summary: string;
  changes: Pick<SiteChange, "level" | "title">[];
  /** Link to the site's monitoring page in the app. */
  link: string;
  /** First check of a site: no diff yet, a short state of the site instead. */
  firstCheck?: { overall: number; topIssues: { title: string; impact: string; count: number }[] };
  /** The check itself failed (site unreachable…). */
  error?: string;
}

/** Why a webhook URL can't be used, or null when it's fine. */
export function webhookProblem(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return "That isn't a valid URL.";
  }
  if (u.protocol !== "https:") return "Webhook URLs must use https://.";
  if (u.username || u.password) return "Don't put credentials in the webhook URL.";
  return null;
}

const LEVEL_LABEL: Record<AlertLevel, string> = { none: "OK", info: "Info", warning: "Warning", critical: "Critical" };

export function renderAlert(c: AlertContent): { subject: string; text: string; html: string } {
  const label = c.error ? "Check failed" : c.firstCheck ? "Monitoring is on" : LEVEL_LABEL[c.level];
  const subject = c.error
    ? `[RankForge] ${c.siteName}: the check failed`
    : c.firstCheck
      ? `[RankForge] Monitoring is on for ${c.siteName} (score ${c.firstCheck.overall})`
      : `[RankForge] ${LEVEL_LABEL[c.level]} on ${c.siteName}: ${c.summary}`.slice(0, 180);

  const lines: string[] = [];
  if (c.error) {
    lines.push(`RankForge couldn't check ${c.siteUrl}: ${c.error}`);
    lines.push("It will try again on the next scheduled check.");
  } else if (c.firstCheck) {
    lines.push(`First check of ${c.siteUrl} done: score ${c.firstCheck.overall}/100.`);
    lines.push("From now on you'll hear from RankForge when something important changes.");
    if (c.firstCheck.topIssues.length) {
      lines.push("");
      lines.push("Worth fixing first:");
      for (const i of c.firstCheck.topIssues) lines.push(`- [${i.impact}] ${i.title} (${i.count})`);
    }
  } else {
    lines.push(`${c.siteUrl}: ${c.summary}`);
    if (c.changes.length) {
      lines.push("");
      for (const ch of c.changes.slice(0, 12)) lines.push(`- [${ch.level}] ${ch.title}`);
      if (c.changes.length > 12) lines.push(`- and ${c.changes.length - 12} more`);
    }
  }
  lines.push("");
  lines.push(`Details: ${c.link}`);
  const text = lines.join("\n");

  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const color = c.error || c.level === "critical" ? "#d1384f" : c.level === "warning" ? "#b9760f" : "#0f9e76";
  const html = `<!doctype html><html><body style="margin:0;background:#f6f4f1;font:15px/1.55 -apple-system,'Segoe UI',Roboto,sans-serif;color:#1a1714">
<div style="max-width:560px;margin:0 auto;padding:28px 20px">
<p style="margin:0 0 4px;font-size:12px;letter-spacing:.02em;color:${color};font-weight:600">${esc(label)}</p>
<h1 style="margin:0 0 14px;font-size:20px">${esc(c.siteName)}</h1>
${lines
  .slice(0, -2)
  .map((l) => (l === "" ? "" : l.startsWith("- ") ? `<p style="margin:2px 0 2px 12px">${esc(l.slice(2))}</p>` : `<p style="margin:0 0 8px">${esc(l)}</p>`))
  .join("\n")}
<p style="margin:22px 0 0"><a href="${esc(c.link)}" style="display:inline-block;background:#ff7a2f;color:#170b04;text-decoration:none;font-weight:600;padding:10px 16px;border-radius:999px">Open in RankForge</a></p>
<p style="margin:22px 0 0;font-size:12px;color:#7a726a">You get this because monitoring is on for ${esc(c.siteUrl)}. Change alerts or turn monitoring off from the same page.</p>
</div></body></html>`;
  return { subject, text, html };
}

/** Email via Resend. Needs RESEND_API_KEY; RANKFORGE_ALERT_FROM must be a verified sender. */
export async function sendEmail(to: string, c: AlertContent): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return false;
  const { subject, text, html } = renderAlert(c);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: process.env.RANKFORGE_ALERT_FROM || "RankForge <onboarding@resend.dev>",
        to: [to],
        subject,
        text,
        html,
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) console.error("[alerts] email failed:", res.status, (await res.text()).slice(0, 200));
    return res.ok;
  } catch (e) {
    console.error("[alerts] email error:", e instanceof Error ? e.message : e);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/** Slack and Discord get their own message shape; anything else gets JSON. */
export async function sendWebhook(url: string, c: AlertContent): Promise<boolean> {
  if (webhookProblem(url)) return false;
  const { subject, text } = renderAlert(c);
  const host = new URL(url).hostname;
  const body = /(^|\.)slack\.com$/.test(host)
    ? { text: `*${subject}*\n${text}` }
    : /(^|\.)discord(app)?\.com$/.test(host)
      ? { content: `**${subject}**\n${text}`.slice(0, 1900) }
      : {
          event: "rankforge.check",
          level: c.error ? "error" : c.level,
          site: c.siteName,
          url: c.siteUrl,
          summary: c.error ?? c.summary,
          changes: c.changes.slice(0, 50),
          link: c.link,
        };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8_000);
  try {
    const res = await guardedFetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "user-agent": "RankForge-Alerts/1.0" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
      maxHops: 0,
    });
    res.body?.cancel().catch(() => {});
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
