import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type TeamRow = {
  id: string;
  display_name: string | null;
  role: "user" | "analyst" | "admin";
  is_verified_analyst: boolean;
  specialization: string | null;
  is_active: boolean;
  xp: number;
  created_at: string;
};

type TeamUpdateInput = {
  userId?: string;
  role?: "user" | "analyst" | "admin";
  isVerifiedAnalyst?: boolean;
  isActive?: boolean;
  specialization?: string;
};

const ensureAdmin = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, authorized: false, status: 401 as const, error: "Authentication required." };
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") {
    return { supabase, user, authorized: false, status: 403 as const, error: "Admin role required." };
  }

  return { supabase, user, authorized: true as const };
};

export async function GET() {
  const access = await ensureAdmin();
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { data, error } = await access.supabase
    .from("profiles")
    .select("id, display_name, role, is_verified_analyst, specialization, is_active, xp, created_at")
    .order("created_at", { ascending: false })
    .limit(250);

  if (error) {
    return NextResponse.json({ error: "Unable to load team members." }, { status: 500 });
  }

  return NextResponse.json(
    {
      team: (data ?? []).map((row) => ({
        id: row.id,
        displayName: row.display_name ?? "Anonymous",
        role: row.role,
        isVerifiedAnalyst: row.is_verified_analyst,
        specialization: row.specialization,
        isActive: row.is_active,
        xp: row.xp,
        createdAt: row.created_at,
      } satisfies TeamRow)),
    },
    { status: 200 }
  );
}

export async function PATCH(request: NextRequest) {
  const access = await ensureAdmin();
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const input = (await request.json()) as TeamUpdateInput;
  if (!input.userId) {
    return NextResponse.json({ error: "userId is required." }, { status: 400 });
  }

  const updatePayload: Record<string, unknown> = {};
  if (input.role) updatePayload.role = input.role;
  if (typeof input.isVerifiedAnalyst === "boolean") updatePayload.is_verified_analyst = input.isVerifiedAnalyst;
  if (typeof input.isActive === "boolean") updatePayload.is_active = input.isActive;
  if (typeof input.specialization === "string") updatePayload.specialization = input.specialization.trim() || null;

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: "No fields provided to update." }, { status: 400 });
  }

  const { data, error } = await access.supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", input.userId)
    .select("id, display_name, role, is_verified_analyst, specialization, is_active, xp, created_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Unable to update team member." }, { status: 500 });
  }

  return NextResponse.json(
    {
      member: {
        id: data.id,
        displayName: data.display_name ?? "Anonymous",
        role: data.role,
        isVerifiedAnalyst: data.is_verified_analyst,
        specialization: data.specialization,
        isActive: data.is_active,
        xp: data.xp,
        createdAt: data.created_at,
      },
    },
    { status: 200 }
  );
}
