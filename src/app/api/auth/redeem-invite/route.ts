import { NextRequest, NextResponse } from "next/server";
import type { AuthStatus } from "@/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type InviteCodeRow = {
  code: string;
  invite_type: "analyst" | "admin";
  is_active: boolean;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
};

type RedeemInput = {
  code?: string;
};

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = (await request.json()) as RedeemInput;
  const code = body.code?.trim().toUpperCase();

  if (!code) {
    return NextResponse.json({ error: "Invite code is required." }, { status: 400 });
  }

  const { data: inviteRow, error: inviteError } = await supabase
    .from("analyst_invite_codes")
    .select("code, invite_type, is_active, max_uses, used_count, expires_at")
    .eq("code", code)
    .single();

  if (inviteError || !inviteRow) {
    return NextResponse.json({ error: "Invalid invite code." }, { status: 404 });
  }

  const invite = inviteRow as InviteCodeRow;
  if (!invite.is_active) {
    return NextResponse.json({ error: "Invite code is not active." }, { status: 400 });
  }

  if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "Invite code has expired." }, { status: 400 });
  }

  if (invite.max_uses !== null && invite.used_count >= invite.max_uses) {
    return NextResponse.json({ error: "Invite code usage limit reached." }, { status: 400 });
  }

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role, is_verified_analyst")
    .eq("id", user.id)
    .single();

  const currentRole = (currentProfile?.role as "user" | "analyst" | "admin" | undefined) ?? "user";
  const currentVerified = Boolean(currentProfile?.is_verified_analyst);

  const profilePatch: {
    role: "user" | "analyst" | "admin";
    is_verified_analyst: boolean;
    invite_code_used: string;
  } = {
    role: currentRole,
    is_verified_analyst: currentVerified,
    invite_code_used: code,
  };

  if (invite.invite_type === "admin") {
    profilePatch.role = "admin";
  } else {
    profilePatch.is_verified_analyst = true;
    if (currentRole !== "admin") {
      profilePatch.role = "analyst";
    }
  }

  const { error: profileUpdateError } = await supabase
    .from("profiles")
    .update(profilePatch)
    .eq("id", user.id);

  if (profileUpdateError) {
    return NextResponse.json({ error: "Unable to verify analyst profile." }, { status: 500 });
  }

  const roleToGrant = invite.invite_type === "admin" ? "admin" : "va";
  const { error: roleGrantError } = await supabase
    .from("user_roles")
    .upsert({ user_id: user.id, role: roleToGrant }, { onConflict: "user_id,role" });

  if (roleGrantError) {
    return NextResponse.json({ error: "Profile updated, but role grant failed." }, { status: 500 });
  }

  const { error: inviteUpdateError } = await supabase
    .from("analyst_invite_codes")
    .update({
      used_count: invite.used_count + 1,
    })
    .eq("code", code);

  if (inviteUpdateError) {
    return NextResponse.json({ error: "Invite code consumed, but usage count update failed." }, { status: 500 });
  }

  const { error: redemptionError } = await supabase.from("invite_redemptions").insert({
    code,
    user_id: user.id,
    invite_type: invite.invite_type,
  });

  if (!redemptionError) {
    await supabase.from("admin_audit_logs").insert({
      actor_id: user.id,
      action: "invite_redeemed",
      target_type: "analyst_invite_codes",
      target_id: code,
      payload: { inviteType: invite.invite_type },
    });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, bio, timezone, specialization, favorite_market, is_active, role, is_verified_analyst, invite_code_used, rank, xp")
    .eq("id", user.id)
    .single();

  const payload: AuthStatus = {
    isAuthenticated: true,
    userId: user.id,
    email: user.email,
    profile: profile
      ? {
          id: profile.id as string,
          displayName: (profile.display_name as string | null) ?? "Anonymous",
          avatarUrl: (profile.avatar_url as string | null) ?? undefined,
          bio: (profile.bio as string | null) ?? undefined,
          timezone: (profile.timezone as string | null) ?? undefined,
          specialization: (profile.specialization as string | null) ?? undefined,
          favoriteMarket: (profile.favorite_market as "forex" | "crypto" | "commodities" | null) ?? undefined,
          isActive: (profile.is_active as boolean) ?? true,
          role: profile.role as "user" | "analyst" | "admin",
          isVerifiedAnalyst: profile.is_verified_analyst as boolean,
          inviteCodeUsed: (profile.invite_code_used as string | null) ?? undefined,
          rank: (profile.rank as string) ?? "Novice",
          xp: (profile.xp as number) ?? 0,
        }
      : undefined,
  };

  return NextResponse.json(payload, { status: 200 });
}
