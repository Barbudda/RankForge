import { NextResponse } from "next/server";
import { handleMessage, rpcError, rpcResult, type JsonRpcRequest } from "@/lib/mcp/server";
import { CRAWLS_PER_HOUR, CRAWL_LIMIT_MESSAGE, isCrawlCall } from "@/lib/mcp/hosted-limits";
import { clientIp, createRateLimiter } from "@/lib/net/public-endpoint";
import { config } from "@/lib/config";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * The Septune agent as an MCP server — Streamable HTTP transport, stateless.
 *
 * Connect from any MCP-capable dev tool:
 *   Claude Code:  claude mcp add --transport http septune http://localhost:3000/api/mcp
 *   Cursor/VS Code/Windsurf: add an "http" MCP server with the same URL.
 *
 * Protocol: JSON-RPC 2.0 over POST (initialize, tools/list, tools/call, ping).
 * Stateless by design — no session ids, every request self-contained — which
 * is explicitly allowed by the MCP Streamable HTTP spec and keeps this a
 * plain Next.js route with zero dependencies.
 *
 * Security:
 * - In production the endpoint is OPT-IN: it returns 401 unless
 *   RANKFORGE_MCP_KEY is set AND the request carries it as a Bearer token.
 * - In development it's open on localhost (the primary use case: auditing
 *   your own dev server from your editor).
 */

function unauthorized() {
  return NextResponse.json(
    rpcError(null, -32001, "Unauthorized — this MCP endpoint requires a Bearer token."),
    { status: 401 },
  );
}

/** Only explicit local development is trusted (fail closed on any other env). */
const IS_DEV = process.env.NODE_ENV === "development";

/** Demo mode: open the hosted endpoint (SSRF still blocks internal hosts). */
const MCP_PUBLIC =
  process.env.RANKFORGE_MCP_PUBLIC === "1" || process.env.RANKFORGE_MCP_PUBLIC === "true";

function checkAuth(req: Request): boolean {
  if (IS_DEV) return true; // open on localhost — the dev use case
  if (MCP_PUBLIC) return true; // explicit public/demo instance
  const key = process.env.RANKFORGE_MCP_KEY;
  if (!key) return false; // hosted: opt-in only (token OR public flag)
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${key}`;
}

/**
 * Reject cross-origin browser requests (DNS-rebinding defense per the MCP
 * Streamable HTTP transport spec). Non-browser clients (Claude Code, the MCP
 * CLI, curl) send no Origin and are allowed.
 */
function originAllowed(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // non-browser client
  try {
    const host = new URL(origin).hostname;
    if (host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1") return true;
    return new URL(origin).origin === new URL(config.appUrl).origin;
  } catch {
    return false;
  }
}

/** Max messages in a JSON-RPC batch (each can trigger an expensive crawl). */
const MAX_BATCH = 8;

// Best-effort, per instance: enough to stop one address from crawling on our bill.
const crawlLimited = createRateLimiter(CRAWLS_PER_HOUR);

/**
 * Over the hourly budget, a crawling tool answers with a tool error (per the
 * MCP spec, so the calling assistant reads it) instead of running.
 */
async function handle(msg: unknown, ip: string): Promise<unknown | null> {
  if (!IS_DEV && isCrawlCall(msg) && crawlLimited(ip)) {
    return rpcResult((msg as JsonRpcRequest).id ?? null, {
      content: [{ type: "text", text: CRAWL_LIMIT_MESSAGE }],
      isError: true,
    });
  }
  return handleMessage(msg);
}

export async function POST(req: Request) {
  if (!originAllowed(req)) {
    return NextResponse.json(rpcError(null, -32003, "Origin not allowed."), { status: 403 });
  }
  if (!checkAuth(req)) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(rpcError(null, -32700, "Parse error"), { status: 400 });
  }

  // Batches: older clients only (2025-06-18 removed them). Bounded, and
  // processed SEQUENTIALLY so one request can't fan out into many crawls.
  if (Array.isArray(body)) {
    if (body.length === 0 || body.length > MAX_BATCH) {
      return NextResponse.json(rpcError(null, -32600, "Invalid batch size."), { status: 400 });
    }
    const ip = clientIp(req);
    const responses: unknown[] = [];
    for (const m of body) {
      const r = await handle(m, ip);
      if (r !== null) responses.push(r);
    }
    if (responses.length === 0) return new Response(null, { status: 202 });
    return NextResponse.json(responses);
  }

  const response = await handle(body, clientIp(req));
  if (response === null) return new Response(null, { status: 202 });
  return NextResponse.json(response);
}

// The stateless server offers no SSE stream and no session to delete.
export async function GET(req: Request) {
  if (!originAllowed(req)) {
    return NextResponse.json(rpcError(null, -32003, "Origin not allowed."), { status: 403 });
  }
  return NextResponse.json(rpcError(null, -32000, "SSE not offered — POST JSON-RPC messages."), {
    status: 405,
  });
}

export async function DELETE() {
  return new Response(null, { status: 405 });
}
