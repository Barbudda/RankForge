"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Logo } from "@/components/brand/logo";

/**
 * Password-recovery landing page. The emailed reset link establishes a
 * recovery session (handled by supabase-js from the URL); this page then
 * collects the new password and updates the user.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    // The recovery link signs the user into a temporary session; enable the
    // form once any session exists (covers both the PASSWORD_RECOVERY event
    // and an already-established session on reload).
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="w-full max-w-sm">
        <Logo className="mb-8" />
        <h1 className="text-2xl font-semibold tracking-tight text-fg">
          Choose a new password
        </h1>
        {!ready ? (
          <p className="mt-3 text-sm text-fg-muted">
            Waiting for your reset link… Open this page from the link in your
            email. If nothing happens,{" "}
            <Link href="/login" className="text-electric-bright hover:underline">
              request a new link
            </Link>
            .
          </p>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-fg-muted">
                New password
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                className="h-11 w-full rounded-lg border border-border bg-surface/60 px-3 text-sm text-fg outline-none placeholder:text-fg-subtle focus-visible:border-electric focus-visible:ring-2 focus-visible:ring-electric/30"
              />
            </label>
            {error && (
              <p
                role="alert"
                className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
              >
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-electric font-medium text-white transition-colors hover:bg-electric-bright disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  Update password
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
