/**
 * One-off transactional email through Resend (pre-order confirmations).
 * Alerts have their own templates in src/lib/monitor/alerts.ts. Returns
 * false, never throws, when Resend isn't configured or refuses: an email is
 * never worth failing the action that triggered it.
 */
export async function sendTransactionalEmail(msg: { to: string; subject: string; text: string; html: string }): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key || !msg.to) return false;
  const from = process.env.RANKFORGE_ALERT_FROM || "Septune <onboarding@resend.dev>";
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ from, to: [msg.to], subject: msg.subject, text: msg.text, html: msg.html }),
      signal: ctrl.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
