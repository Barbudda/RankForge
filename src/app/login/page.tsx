import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-16">
      {/* Set by /auth/confirm when an email link can't be used. */}
      {error === "link" && (
        <p role="alert" className="w-full max-w-sm rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          That link has expired or was already used. Sign in, or use &ldquo;Forgot password?&rdquo; to get a new one.
        </p>
      )}
      <AuthForm mode="login" next={next || "/dashboard"} />
    </main>
  );
}
