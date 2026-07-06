import type { Plan, User, Workspace } from "@/types";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * The account owner, derived from the Supabase auth session + profiles row.
 * Falls back to env-configured defaults when Supabase isn't configured or
 * there's no session, so the app still renders.
 */

const DEFAULT_AVATAR = "https://avatars.githubusercontent.com/u/0?v=4";

const FALLBACK_USER: User = {
  id: "owner",
  name: process.env.NEXT_PUBLIC_OWNER_NAME || "You",
  email: process.env.NEXT_PUBLIC_OWNER_EMAIL || "you@rankforge.dev",
  avatarUrl: process.env.NEXT_PUBLIC_OWNER_AVATAR || DEFAULT_AVATAR,
  githubLogin: process.env.NEXT_PUBLIC_OWNER_GITHUB || "you",
};

const FALLBACK_WORKSPACE: Workspace = {
  id: "ws_owner",
  name: process.env.NEXT_PUBLIC_WORKSPACE_NAME || "My workspace",
  slug: "workspace",
  plan: "growth",
  repoCount: 0,
  seatCount: 1,
};

export async function getCurrentUser(): Promise<User> {
  if (!isSupabaseConfigured) return FALLBACK_USER;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return FALLBACK_USER;

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email, avatar_url, github_login")
    .eq("id", user.id)
    .maybeSingle();

  const handle = user.email?.split("@")[0] || "you";
  return {
    id: user.id,
    name: profile?.name || handle,
    email: profile?.email || user.email || "",
    avatarUrl: profile?.avatar_url || DEFAULT_AVATAR,
    githubLogin: profile?.github_login || handle,
  };
}

export async function getCurrentWorkspace(): Promise<Workspace> {
  if (!isSupabaseConfigured) return FALLBACK_WORKSPACE;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return FALLBACK_WORKSPACE;

  const [{ data: profile }, { count }] = await Promise.all([
    supabase
      .from("profiles")
      .select("workspace_name, plan")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("repositories")
      .select("*", { count: "exact", head: true }),
  ]);

  return {
    id: `ws_${user.id}`,
    name: profile?.workspace_name || "My workspace",
    slug: "workspace",
    plan: (profile?.plan as Plan) || "growth",
    repoCount: count ?? 0,
    seatCount: 1,
  };
}
