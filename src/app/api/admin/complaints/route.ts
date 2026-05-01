import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ComplaintStatus = "open" | "under_review" | "resolved" | "dismissed";

type ComplaintRow = {
  id: string;
  category: string;
  summary: string;
  detail: string;
  severity: "low" | "medium" | "high";
  status: ComplaintStatus;
  thread_id: string | null;
  thread_url: string | null;
  created_at: string;
  updated_at: string;
  reported_user_id: { id: string; display_name: string | null } | null;
  reported_by_id: { id: string; display_name: string | null } | null;
};

type ComplaintUpdateInput = {
  id?: string;
  status?: ComplaintStatus;
};

const ensureAdmin = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, authorized: false, status: 401 as const, error: "Authentication required." };
  }

  const { data: adminRole } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!adminRole) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      return { supabase, user, authorized: false, status: 403 as const, error: "Admin role required." };
    }
  }

  return { supabase, user, authorized: true as const };
};

export async function GET() {
  const access = await ensureAdmin();
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { data, error } = await access.supabase
    .from("forum_complaints")
    .select(
      "id, category, summary, detail, severity, status, thread_id, thread_url, created_at, updated_at, reported_user_id (id, display_name), reported_by_id (id, display_name)"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: "Unable to load complaints." }, { status: 500 });
  }

  const rows = (data ?? []) as ComplaintRow[];
  const complaints = rows.map((row) => ({
    id: row.id,
    reportedUser: row.reported_user_id?.display_name ?? "Unknown",
    reportedBy: row.reported_by_id?.display_name ?? "Unknown",
    category: row.category,
    summary: row.summary,
    detail: row.detail,
    severity: row.severity,
    status: row.status,
    threadId: row.thread_id ?? undefined,
    threadUrl: row.thread_url ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return NextResponse.json({ complaints }, { status: 200 });
}

export async function PATCH(request: NextRequest) {
  const access = await ensureAdmin();
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const input = (await request.json()) as ComplaintUpdateInput;
  if (!input.id || !input.status) {
    return NextResponse.json({ error: "Complaint id and status are required." }, { status: 400 });
  }

  const { data, error } = await access.supabase
    .from("forum_complaints")
    .update({ status: input.status })
    .eq("id", input.id)
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Unable to update complaint." }, { status: 500 });
  }

  await access.supabase.from("admin_audit_logs").insert({
    actor_id: access.user?.id ?? null,
    action: "complaint_status_update",
    target_type: "forum_complaints",
    target_id: input.id,
    payload: { status: input.status },
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
