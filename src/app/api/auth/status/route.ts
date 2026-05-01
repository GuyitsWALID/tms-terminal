import { NextResponse } from "next/server";
import type { AuthStatus, UserProfile } from "@/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

type ProfileRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: "user" | "analyst" | "admin";
  is_verified_analyst: boolean;
  invite_code_used: string | null;
  rank: string;
  xp: number;
};

const mapProfile = (row: ProfileRow): UserProfile => ({
  id: row.id,
  displayName: row.display_name ?? "Anonymous",
  avatarUrl: row.avatar_url ?? undefined,
  role: row.role,
  isVerifiedAnalyst: row.is_verified_analyst,
  inviteCodeUsed: row.invite_code_used ?? undefined,
  rank: row.rank,
  xp: row.xp,
});

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;

  const supabase = bearer
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
        {
          auth: { persistSession: false, autoRefreshToken: false },
        }
      )
    : await createSupabaseServerClient();

  const {
    data: { user },
  } = bearer ? await supabase.auth.getUser(bearer) : await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ isAuthenticated: false } satisfies AuthStatus, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, role, is_verified_analyst, invite_code_used, rank, xp")
    .eq("id", user.id)
    .single();

  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const roles = (roleRows ?? [])
    .map((row) => row.role as "admin" | "va")
    .filter((role) => role === "admin" || role === "va");

  // Backward-compatible fallback: accept admin role from profiles when user_roles is not yet populated.
  if (profile && (profile as ProfileRow).role === "admin" && !roles.includes("admin")) {
    roles.push("admin");
  }

  if (profile && roles.includes("va") && !(profile as ProfileRow).is_verified_analyst) {
    (profile as ProfileRow).is_verified_analyst = true;
  }

  return NextResponse.json(
    {
      isAuthenticated: true,
      userId: user.id,
      email: user.email,
      isEmailVerified: Boolean(user.email_confirmed_at),
      roles,
      profile: profile ? mapProfile(profile as ProfileRow) : undefined,
    } satisfies AuthStatus,
    {
      headers: { "Cache-Control": "no-store" },
    }
  );
}
