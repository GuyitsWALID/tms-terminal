import { NextResponse } from "next/server";
import type { AuthStatus, UserProfile } from "@/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ProfileRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  timezone: string | null;
  specialization: string | null;
  favorite_market: "forex" | "crypto" | "commodities" | null;
  is_active: boolean;
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
  bio: row.bio ?? undefined,
  timezone: row.timezone ?? undefined,
  specialization: row.specialization ?? undefined,
  favoriteMarket: row.favorite_market ?? undefined,
  isActive: row.is_active,
  role: row.role,
  isVerifiedAnalyst: row.is_verified_analyst,
  inviteCodeUsed: row.invite_code_used ?? undefined,
  rank: row.rank,
  xp: row.xp,
});

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ isAuthenticated: false } satisfies AuthStatus, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, bio, timezone, specialization, favorite_market, is_active, role, is_verified_analyst, invite_code_used, rank, xp")
    .eq("id", user.id)
    .single();

  return NextResponse.json(
    {
      isAuthenticated: true,
      userId: user.id,
      email: user.email,
      profile: profile ? mapProfile(profile as ProfileRow) : undefined,
    } satisfies AuthStatus,
    {
      headers: { "Cache-Control": "no-store" },
    }
  );
}
