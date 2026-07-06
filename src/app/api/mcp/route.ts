import { NextResponse } from "next/server";
import { MCP_TOOLS } from "@/lib/mcp/tools";
import { config } from "@/lib/config";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * The RankForge agent as an MCP server — Streamable HTTP transport, stateless.
 *
 * Connect from any MCP-capable dev tool:
 *   Claude Code:  claude mcp add --transport http rankforge http://localhost:3000/api/mcp
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

const PROTOCOL_VERSION = "2025-06-18";
const SUPPORTED_VERSIONS = new Set(["2024-11-05", "2025-03-26", "2025-06-18"]);

type JsonRpcRequest = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

function rpcResult(id: JsonRpcRequest["id"], result: unknown) {
  return { jsonrpc: "2.0", id: id ?? null, result };
}

function rpcError(id: JsonRpcRequest["id"], code: number, message: string) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } };
}

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

async function handleMessage(raw: unknown): Promise<unknown | null> {
  // Shape guard: a non-object (null, array, string, number) is an Invalid
  // Request, not a crash. `null`/`[]` bodies used to throw a 500.
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return rpcError(null, -32600, "Invalid Request");
  }
  const msg = raw as JsonRpcRequest;
  const { id, method, params } = msg;

  // A JSON-RPC *response* posted by a client (has result/error, no method) is
  // accepted silently (no reply).
  if (typeof method !== "string") {
    if ("result" in msg || "error" in msg) return null;
    // A request with an explicit null id is malformed per the MCP base spec.
    if (id === undefined) return null; // notification without method — ignore
    return rpcError(id ?? null, -32600, "Invalid Request");
  }

  // Notifications have no id → no response body. (null id is malformed for a
  // request, but we tolerate it as fire-and-forget rather than erroring.)
  if (id === undefined || id === null) {
    // Still no side-effect-free reply for notifications.
    if (method.startsWith("notifications/")) return null;
    return null;
  }

  switch (method) {
    case "initialize": {
      const requested = String(params?.protocolVersion ?? "");
      return rpcResult(id, {
        protocolVersion: SUPPORTED_VERSIONS.has(requested) ? requested : PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: {
          name: "rankforge",
          title: "RankForge — technical SEO agent",
          version: "0.1.0",
        },
        instructions:
          "RankForge measures technical SEO deterministically. Typical loop: audit_site on the dev/prod URL → fix the reported issues in this repository (get_fix_template gives idiomatic patches for mechanical ones) → re-run audit_site to verify. Use seo_docs to explain any issue to the user. Never promise search-ranking outcomes.",
      });
    }
    case "ping":
      return rpcResult(id, {});
    case "tools/list":
      return rpcResult(id, {
        tools: MCP_TOOLS.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema,
        })),
      });
    case "tools/call": {
      const name = String(params?.name ?? "");
      const tool = MCP_TOOLS.find((t) => t.name === name);
      if (!tool) return rpcError(id, -32602, `Unknown tool: ${name}`);
      const args = (params?.arguments ?? {}) as Record<string, unknown>;
      try {
        const text = await tool.handler(args);
        return rpcResult(id, { content: [{ type: "text", text }], isError: false });
      } catch (e) {
        // Tool-level failures are results with isError (per spec), not
        // protocol errors — the calling agent can read and react to them.
        return rpcResult(id, {
          content: [{ type: "text", text: e instanceof Error ? e.message : "Tool failed." }],
          isError: true,
        });
      }
    }
    default:
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}

/** Max messages in a JSON-RPC batch (each can trigger an expensive crawl). */
const MAX_BATCH = 8;

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
    const responses: unknown[] = [];
    for (const m of body) {
      const r = await handleMessage(m);
      if (r !== null) responses.push(r);
    }
    if (responses.length === 0) return new Response(null, { status: 202 });
    return NextResponse.json(responses);
  }

  const response = await handleMessage(body);
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
