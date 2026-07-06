"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, ArrowRight } from "lucide-react";
import type { Framework } from "@/types";
import { connectRepository } from "@/lib/data/actions";
import { GithubIcon } from "@/components/brand/github-icon";

const FRAMEWORKS: { value: Framework; label: string }[] = [
  { value: "nextjs", label: "Next.js" },
  { value: "nuxt", label: "Nuxt" },
  { value: "astro", label: "Astro" },
  { value: "sveltekit", label: "SvelteKit" },
  { value: "remix", label: "Remix" },
  { value: "vite-react", label: "Vite + React" },
  { value: "mdx", label: "MDX" },
  { value: "static", label: "Static" },
];

/** Trigger button + modal that connects a repository (persists to Supabase). */
export function ConnectRepoButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [productionUrl, setProductionUrl] = useState("");
  const [framework, setFramework] = useState<Framework>("nextjs");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Native <dialog>: showModal() provides the focus trap, Escape handling and
  // focus restore to the trigger; we also lock background scroll while open.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      document.body.style.overflow = "hidden";
    } else if (!open && dialog.open) {
      dialog.close();
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await connectRepository({ fullName, productionUrl, framework });
    setSaving(false);
    if (res.ok) {
      setOpen(false);
      setFullName("");
      setProductionUrl("");
      router.refresh();
    } else {
      setError(res.error ?? "Couldn't connect the repository.");
    }
  };

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {children}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="connect-repo-title"
        onCancel={(e) => {
          e.preventDefault();
          setOpen(false);
        }}
        onClick={(e) => {
          // A click on the backdrop targets the <dialog> element itself.
          if (e.target === dialogRef.current) setOpen(false);
        }}
        className="z-[120] m-auto w-full max-w-md overflow-hidden rounded-2xl border border-border bg-elevated p-0 text-fg shadow-2xl shadow-black/50 backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      >
        {open && (
          <div className="relative">
            <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
              <span className="grid size-8 place-items-center rounded-lg border border-border bg-surface">
                <GithubIcon className="size-4 text-fg" />
              </span>
              <div className="flex-1">
                <h2 id="connect-repo-title" className="text-sm font-semibold text-fg">
                  Connect a repository
                </h2>
                <p className="text-[11px] text-fg-subtle">
                  Add the repo and its production URL to start auditing.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="grid size-7 place-items-center rounded-md text-fg-subtle hover:text-fg"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={submit} className="space-y-4 p-5">
              <Field label="Repository" hint="owner / name">
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="acme/acme-saas-web"
                  required
                  autoFocus
                  className="h-10 w-full rounded-lg border border-border bg-surface/60 px-3 font-mono text-sm text-fg outline-none placeholder:text-fg-subtle focus-visible:border-electric/50"
                />
              </Field>

              <Field label="Production URL">
                <input
                  type="url"
                  value={productionUrl}
                  onChange={(e) => setProductionUrl(e.target.value)}
                  placeholder="https://acme.com"
                  required
                  className="h-10 w-full rounded-lg border border-border bg-surface/60 px-3 text-sm text-fg outline-none placeholder:text-fg-subtle focus-visible:border-electric/50"
                />
              </Field>

              <Field label="Framework">
                <select
                  value={framework}
                  onChange={(e) => setFramework(e.target.value as Framework)}
                  className="h-10 w-full rounded-lg border border-border bg-surface/60 px-3 text-sm text-fg outline-none focus-visible:border-electric/50"
                >
                  {FRAMEWORKS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </Field>

              {error && (
                <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-medium text-fg-muted transition-colors hover:text-fg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-electric px-5 text-sm font-medium text-white transition-colors hover:bg-electric-bright disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      Connect
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </dialog>
    </>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-2 text-sm font-medium text-fg-muted">
        {label}
        {hint && <span className="text-[11px] text-fg-subtle">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
