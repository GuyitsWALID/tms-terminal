import { NextRequest, NextResponse } from "next/server";
import type { UserProfile } from "@/types";
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

type UpdateProfileInput = {
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  timezone?: string;
  specialization?: string;
  favoriteMarket?: "forex" | "crypto" | "commodities" | "";
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

const pickValue = (value: string | undefined) => {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, bio, timezone, specialization, favorite_market, is_active, role, is_verified_analyst, invite_code_used, rank, xp")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: "Unable to load profile." }, { status: 500 });
  }

  return NextResponse.json({ profile: mapProfile(profile as ProfileRow) }, { status: 200 });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const input = (await request.json()) as UpdateProfileInput;

  const payload = {
    display_name: pickValue(input.displayName),
    avatar_url: pickValue(input.avatarUrl),
    bio: pickValue(input.bio),
    timezone: pickValue(input.timezone),
    specialization: pickValue(input.specialization),
    favorite_market: input.favoriteMarket && input.favoriteMarket !== "" ? input.favoriteMarket : null,
  };

  const { data: profile, error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", user.id)
    .select("id, display_name, avatar_url, bio, timezone, specialization, favorite_market, is_active, role, is_verified_analyst, invite_code_used, rank, xp")
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: "Unable to update profile." }, { status: 500 });
  }

  return NextResponse.json({ profile: mapProfile(profile as ProfileRow) }, { status: 200 });
}
