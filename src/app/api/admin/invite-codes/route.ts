import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CreateInviteInput = {
  code?: string;
  maxUses?: number | null;
  expiresAt?: string | null;
  inviteType?: "analyst" | "admin";
};

const isAdmin = async (userId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (data) {
    return true;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  return profile?.role === "admin";
};

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!(await isAdmin(user.id))) {
    return NextResponse.json({ error: "Admin role required." }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("analyst_invite_codes")
    .select("code, invite_type, is_active, max_uses, used_count, expires_at, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Unable to load invite codes." }, { status: 500 });
  }

  return NextResponse.json({ inviteCodes: data ?? [] }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!(await isAdmin(user.id))) {
    return NextResponse.json({ error: "Admin role required." }, { status: 403 });
  }

  const body = (await request.json()) as CreateInviteInput;
  const code = (body.code?.trim().toUpperCase() || crypto.randomUUID().replace(/-/g, "").slice(0, 12)).toUpperCase();
  const inviteType = body.inviteType === "admin" ? "admin" : "analyst";

  const { data, error } = await supabase
    .from("analyst_invite_codes")
    .insert({
      code,
      invite_type: inviteType,
      max_uses: body.maxUses ?? null,
      expires_at: body.expiresAt ?? null,
      created_by: user.id,
      is_active: true,
      used_count: 0,
    })
    .select("code, invite_type, is_active, max_uses, used_count, expires_at, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "Unable to create invite code." }, { status: 500 });
  }

  await supabase.from("admin_audit_logs").insert({
    actor_id: user.id,
    action: "invite_code_created",
    target_type: "analyst_invite_codes",
    target_id: data.code,
    payload: { inviteType: data.invite_type, maxUses: data.max_uses, expiresAt: data.expires_at },
  });

  return NextResponse.json({ inviteCode: data }, { status: 201 });
}
