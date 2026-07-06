import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app/app-sidebar";
import { AppTopbar } from "@/components/app/app-topbar";
import { MobileNav } from "@/components/app/mobile-nav";
import { getCurrentUser, getCurrentWorkspace } from "@/lib/account";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

// Authenticated product surface — never index any (app) route.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense in depth: middleware guards these routes, but it fails open on
  // Supabase errors — re-check the session server-side so a middleware gap
  // can never render the shell to an unauthenticated visitor.
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user: session },
    } = await supabase.auth.getUser();
    if (!session) redirect("/login");
  }

  const [user, workspace] = await Promise.all([
    getCurrentUser(),
    getCurrentWorkspace(),
  ]);
  return (
    <div className="flex min-h-screen bg-bg">
      <AppSidebar workspace={workspace} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar user={user} />
        <main className="flex-1 px-5 pb-24 pt-6 lg:pb-10 lg:pt-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
