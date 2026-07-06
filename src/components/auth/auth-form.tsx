"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Logo } from "@/components/brand/logo";

/** Only same-origin paths — blocks open redirects via ?next=//evil.tld. */
function sanitizeNext(next: string | undefined): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/dashboard";
}

/** Map raw Supabase auth errors to friendly, non-leaky messages. */
function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "That email and password don't match.";
  if (m.includes("already registered"))
    return "An account with this email already exists — sign in instead.";
  if (m.includes("rate limit"))
    return "Too many attempts. Wait a minute and try again.";
  if (m.includes("password should be"))
    return "Password must be at least 6 characters.";
  return message;
}

export function AuthForm({
  mode,
  next,
}: {
  mode: "login" | "signup";
  next?: string;
}) {
  const router = useRouter();
  const target = sanitizeNext(next);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const isLogin = mode === "login";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setError(
        "Supabase isn't configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local.",
      );
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createClient();

    if (resetMode) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${location.origin}/reset-password`,
      });
      setLoading(false);
      if (error) setError(friendlyAuthError(error.message));
      else setResetSent(true);
      return;
    }

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(friendlyAuthError(error.message));
        setLoading(false);
        return;
      }
      router.push(target);
      router.refresh();
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name: name || email.split("@")[0] },
          // Land the confirmation link back on THIS deployment (not Supabase's
          // configured Site URL, which may still be localhost).
          emailRedirectTo: `${location.origin}/login`,
        },
      });
      if (error) {
        setError(friendlyAuthError(error.message));
        setLoading(false);
        return;
      }
      // If email confirmation is on, there's no session yet.
      if (!data.session) {
        setConfirmSent(true);
        setLoading(false);
        return;
      }
      router.push(target);
      router.refresh();
    }
  };

  if (confirmSent || resetSent) {
    return (
      <div className="w-full max-w-sm text-center">
        <Logo className="mx-auto mb-8" />
        <h1 className="text-xl font-semibold text-fg">Check your inbox</h1>
        <p className="mt-2 text-sm text-fg-muted">
          {resetSent ? (
            <>
              We sent a password-reset link to <strong>{email}</strong>. Follow
              it to choose a new password.
            </>
          ) : (
            <>
              We sent a confirmation link to <strong>{email}</strong>. Click it
              to activate your account, then sign in.
            </>
          )}
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm text-electric-bright hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <Logo className="mb-8" />
      <h1 className="text-2xl font-semibold tracking-tight text-fg">
        {resetMode
          ? "Reset your password"
          : isLogin
            ? "Welcome back"
            : "Create your account"}
      </h1>
      <p className="mt-1.5 text-sm text-fg-muted">
        {resetMode
          ? "Enter your account email and we'll send a reset link."
          : isLogin
            ? "Sign in to your RankForge workspace."
            : "Start opening technical-SEO pull requests."}
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        {!isLogin && !resetMode && (
          <Field
            label="Name"
            type="text"
            value={name}
            onChange={setName}
            placeholder="Ada Lovelace"
            autoComplete="name"
          />
        )}
        <Field
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
        {!resetMode && (
          <div>
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              autoComplete={isLogin ? "current-password" : "new-password"}
              minLength={6}
              required
            />
            {isLogin && (
              <button
                type="button"
                onClick={() => {
                  setResetMode(true);
                  setError(null);
                }}
                className="mt-1.5 text-xs text-fg-subtle hover:text-fg hover:underline"
              >
                Forgot password?
              </button>
            )}
          </div>
        )}

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
              {resetMode
                ? "Send reset link"
                : isLogin
                  ? "Sign in"
                  : "Create account"}
              <ArrowRight className="size-4" />
            </>
          )}
        </button>

        {!isLogin && !resetMode && (
          <p className="text-center text-xs text-fg-subtle">
            By creating an account you agree to the{" "}
            <Link href="/terms" className="underline hover:text-fg">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-fg">
              Privacy Policy
            </Link>
            .
          </p>
        )}
      </form>

      <p className="mt-6 text-center text-sm text-fg-muted">
        {resetMode ? (
          <button
            type="button"
            onClick={() => setResetMode(false)}
            className="text-electric-bright hover:underline"
          >
            Back to sign in
          </button>
        ) : (
          <>
            {isLogin ? "New to RankForge? " : "Already have an account? "}
            <Link
              href={isLogin ? "/signup" : "/login"}
              className="text-electric-bright hover:underline"
            >
              {isLogin ? "Create an account" : "Sign in"}
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-fg-muted">
        {label}
      </span>
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-lg border border-border bg-surface/60 px-3 text-sm text-fg outline-none placeholder:text-fg-subtle focus-visible:border-electric focus-visible:ring-2 focus-visible:ring-electric/30"
      />
    </label>
  );
}
