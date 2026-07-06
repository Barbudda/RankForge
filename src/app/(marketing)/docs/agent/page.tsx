import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage, ProseBlock } from "@/components/marketing/prose-page";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema } from "@/lib/seo/schema";

export const metadata: Metadata = {
  title: "Use the RankForge agent in your editor (MCP)",
  description:
    "Connect RankForge to Claude Code, Cursor, VS Code or any MCP client: your AI coding assistant audits your site with RankForge's engine and fixes the code in your repo.",
  alternates: { canonical: "/docs/agent" },
};

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-lg border border-border bg-code p-4 font-mono text-xs leading-relaxed text-fg-muted">
      <code>{children}</code>
    </pre>
  );
}

export default function AgentDocsPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Docs", path: "/docs" },
          { name: "Agent in your editor", path: "/docs/agent" },
        ])}
      />
      <ProsePage
        title="The RankForge agent, inside your editor"
        intro="RankForge ships as an MCP server. Connect it to Claude Code, Cursor, VS Code, Windsurf or any MCP-capable assistant: the assistant measures your site with RankForge's deterministic engine, then fixes the code right in the repository it already has open."
      >
        <ProseBlock heading="Why this beats a dashboard">
          <p>
            An audit report tells you what&apos;s wrong; your coding assistant can
            actually change the code. With RankForge connected over MCP, one
            prompt — <em>&ldquo;audit my dev server and fix what you find&rdquo;</em> —
            runs the full technical-SEO audit against{" "}
            <span className="font-mono text-xs">localhost</span>, walks the
            findings, patches your files, and re-audits to verify. The
            measurements are deterministic (no AI guessing); the reasoning is
            your assistant&apos;s.
          </p>
        </ProseBlock>

        <ProseBlock heading="Connect from Claude Code">
          <p>Run RankForge locally (or use your deployed instance), then:</p>
          <CodeBlock>{`claude mcp add --transport http rankforge http://localhost:3000/api/mcp`}</CodeBlock>
          <p className="mt-3">
            That&apos;s it. Ask Claude Code:{" "}
            <em>&ldquo;Use rankforge to audit http://localhost:3000 and fix the
            issues you can.&rdquo;</em>
          </p>
        </ProseBlock>

        <ProseBlock heading="Connect from Cursor / VS Code / Windsurf">
          <p>
            Add an HTTP MCP server to your client&apos;s configuration (e.g.{" "}
            <span className="font-mono text-xs">.cursor/mcp.json</span> or VS
            Code&apos;s <span className="font-mono text-xs">mcp.json</span>):
          </p>
          <CodeBlock>{`{
  "mcpServers": {
    "rankforge": {
      "url": "http://localhost:3000/api/mcp"
    }
  }
}`}</CodeBlock>
        </ProseBlock>

        <ProseBlock heading="What the agent can do">
          <ul className="mt-2 list-inside list-disc space-y-2">
            <li>
              <span className="font-mono text-xs">audit_site</span> — full
              deterministic audit: category scores, every issue with evidence,
              orphan pages, click depth, duplicate-content clusters, semantic
              internal-link suggestions, measured image weights and broken
              links. Works on localhost.
            </li>
            <li>
              <span className="font-mono text-xs">audit_page</span> — instant
              single-page check while you iterate.
            </li>
            <li>
              <span className="font-mono text-xs">get_fix_template</span> —
              framework-idiomatic patch (unified diff) for mechanical issues:
              robots, sitemap, viewport, lang, canonical, structured data,
              OpenGraph image.
            </li>
            <li>
              <span className="font-mono text-xs">seo_docs</span> — grounded
              answers from the{" "}
              <Link href="/docs" className="text-electric-bright hover:underline">
                RankForge knowledge base
              </Link>
              , so the assistant explains issues accurately.
            </li>
            <li>
              <span className="font-mono text-xs">list_rules</span> — the full
              rule catalog with documentation links.
            </li>
          </ul>
        </ProseBlock>

        <ProseBlock heading="Local vs hosted">
          <p>
            Running RankForge locally, the agent audits{" "}
            <span className="font-mono text-xs">localhost</span> — see issues as
            you build, before deploying. A <em>hosted</em> instance (e.g. on
            Vercel) audits <strong>public URLs</strong> instead: it crawls from
            the server, so it can&apos;t reach your machine&apos;s localhost.
            Point it at your live or staging site; to audit a dev server, run
            RankForge on your own machine.
          </p>
        </ProseBlock>

        <ProseBlock heading="Security model">
          <p>
            In development the endpoint is open on localhost. A deployed
            instance is locked by default and refuses to probe private or
            internal addresses — it validates every resolved IP, including
            through redirects. To let people connect to a hosted instance, set{" "}
            <span className="font-mono text-xs">RANKFORGE_MCP_PUBLIC=1</span> to
            open it, or{" "}
            <span className="font-mono text-xs">RANKFORGE_MCP_KEY</span> to
            require a Bearer token. Either way the tools only read rendered
            pages — the same thing any crawler sees — and nothing touches your
            repository without a human merging a pull request.
          </p>
        </ProseBlock>
      </ProsePage>
    </>
  );
}
