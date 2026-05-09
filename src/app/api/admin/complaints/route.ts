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
  reported_user_id: Array<{ id: string; display_name: string | null }> | null;
  reported_by_id: Array<{ id: string; display_name: string | null }> | null;
  forum_threads?: { id: string; title: string; author_id: string } | null;
};

type ComplaintUpdateInput = {
  id?: string;
  status?: ComplaintStatus;
};

const ensurePortalAccess = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, authorized: false, status: 401 as const, error: "Authentication required." };
  }

  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_verified_analyst")
    .eq("id", user.id)
    .maybeSingle();

  const roles = (roleRows ?? []).map((row) => row.role);
  const isAdmin = roles.includes("admin") || profile?.role === "admin";
  const isVa = roles.includes("va") || profile?.is_verified_analyst === true || profile?.role === "analyst";
  const authorized = isAdmin || isVa;

  if (!authorized) {
    return { supabase, user, authorized: false, status: 403 as const, error: "Admin or VA role required." };
  }

  return { supabase, user, authorized: true as const, isAdmin };
};

export async function GET() {
  const access = await ensurePortalAccess();
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  let query = access.supabase
    .from("forum_complaints")
    .select(
      "id, category, summary, detail, severity, status, thread_id, thread_url, created_at, updated_at, reported_user_id (id, display_name), reported_by_id (id, display_name), forum_threads:thread_id (id, title, author_id)"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (!access.isAdmin) {
    const { data: ownThreads } = await access.supabase.from("forum_threads").select("id").eq("author_id", access.user?.id ?? "");
    const ids = (ownThreads ?? []).map((t) => t.id);
    if (ids.length === 0) return NextResponse.json({ complaints: [] }, { status: 200 });
    query = query.in("thread_id", ids);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Unable to load complaints." }, { status: 500 });
  }

  const rows = (data ?? []) as ComplaintRow[];
  const complaints = rows.map((row) => {
    const reportedUser = row.reported_user_id?.[0]?.display_name ?? "Unknown";
    const reportedBy = row.reported_by_id?.[0]?.display_name ?? "Unknown";
    return {
    id: row.id,
    reportedUser,
    reportedBy,
    category: row.category,
    summary: row.summary,
    detail: row.detail,
    severity: row.severity,
    status: row.status,
    threadId: row.thread_id ?? undefined,
    threadTitle: row.forum_threads?.title ?? "Unknown Thread",
    threadAuthorId: row.forum_threads?.author_id ?? undefined,
    threadUrl: row.thread_url ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    };
  });

  return NextResponse.json({ complaints }, { status: 200 });
}

export async function PATCH(request: NextRequest) {
  const access = await ensurePortalAccess();
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  if (!access.isAdmin) {
    return NextResponse.json({ error: "Only admin can update complaint status." }, { status: 403 });
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
