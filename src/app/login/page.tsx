import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { LinkErrorNotice } from "@/components/auth/link-error-notice";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

// Static on purpose: no searchParams here, so the page is served from the CDN
// instead of starting a function (a cold start cost 1.8 s of TTFB).
export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-16">
      <LinkErrorNotice />
      <AuthForm mode="login" />
    </main>
  );
}
