import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ActivityItem = {
  id: string;
  message: string;
  createdAt: string;
  color: string;
  type: string;
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

const buildMonths = () => {
  const now = new Date();
  const months: { key: string; label: string; start: Date }[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = start.toLocaleString("en-US", { month: "short" });
    const key = `${start.getFullYear()}-${start.getMonth() + 1}`;
    months.push({ key, label, start });
  }
  return months;
};

export async function GET() {
  const access = await ensureAdmin();
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const months = buildMonths();
  const startDate = months[0].start.toISOString();

  const [totalUsersRes, analystsRes, invitesRes, complaintsRes, usersRecentRes, invitesRecentRes, complaintsRecentRes, notificationsRecentRes, auditRecentRes, usersGrowthRes] =
    await Promise.all([
      access.supabase.from("profiles").select("id", { count: "exact", head: true }),
      access.supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_verified_analyst", true),
      access.supabase.from("analyst_invite_codes").select("code", { count: "exact", head: true }).eq("is_active", true),
      access.supabase.from("forum_complaints").select("id", { count: "exact", head: true }).eq("status", "open"),
      access.supabase.from("profiles").select("id, display_name, created_at").order("created_at", { ascending: false }).limit(6),
      access.supabase.from("invite_redemptions").select("id, code, created_at, user: user_id (display_name)").order("created_at", { ascending: false }).limit(6),
      access.supabase.from("forum_complaints").select("id, summary, created_at").order("created_at", { ascending: false }).limit(6),
      access.supabase.from("admin_notifications").select("id, title, sent_at").order("sent_at", { ascending: false }).limit(6),
      access.supabase.from("admin_audit_logs").select("id, action, created_at").order("created_at", { ascending: false }).limit(6),
      access.supabase.from("profiles").select("created_at").gte("created_at", startDate),
    ]);

  if (
    totalUsersRes.error ||
    analystsRes.error ||
    invitesRes.error ||
    complaintsRes.error ||
    usersRecentRes.error ||
    invitesRecentRes.error ||
    complaintsRecentRes.error ||
    notificationsRecentRes.error ||
    auditRecentRes.error ||
    usersGrowthRes.error
  ) {
    return NextResponse.json({ error: "Unable to load dashboard data." }, { status: 500 });
  }

  const summary = {
    totalUsers: totalUsersRes.count ?? 0,
    verifiedAnalysts: analystsRes.count ?? 0,
    activeInvites: invitesRes.count ?? 0,
    openComplaints: complaintsRes.count ?? 0,
  };

  const monthMap = new Map(months.map((m) => [m.key, 0]));
  (usersGrowthRes.data ?? []).forEach((row) => {
    const date = new Date((row as { created_at: string }).created_at);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    if (monthMap.has(key)) {
      monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
    }
  });

  let cumulative = 0;
  const growth = months.map((m) => {
    cumulative += monthMap.get(m.key) ?? 0;
    return { month: m.label, users: cumulative };
  });

  const activities: ActivityItem[] = [];

  (usersRecentRes.data ?? []).forEach((row) => {
    const data = row as { id: string; display_name: string | null; created_at: string };
    activities.push({
      id: `user-${data.id}`,
      message: `New user registered: ${data.display_name ?? "Anonymous"}`,
      createdAt: data.created_at,
      color: "#1d9bf0",
      type: "user_join",
    });
  });

  (invitesRecentRes.data ?? []).forEach((row) => {
    const data = row as {
      id: string;
      code: string;
      created_at: string;
      user?: Array<{ display_name: string | null }> | null;
    };
    const redeemedBy = data.user?.[0]?.display_name ?? "a user";
    activities.push({
      id: `invite-${data.id}`,
      message: `Invite code ${data.code} redeemed by ${redeemedBy}`,
      createdAt: data.created_at,
      color: "#2ecf87",
      type: "invite_used",
    });
  });

  (complaintsRecentRes.data ?? []).forEach((row) => {
    const data = row as { id: string; summary: string; created_at: string };
    activities.push({
      id: `complaint-${data.id}`,
      message: `New complaint: ${data.summary}`,
      createdAt: data.created_at,
      color: "#ff4b55",
      type: "complaint",
    });
  });

  (notificationsRecentRes.data ?? []).forEach((row) => {
    const data = row as { id: string; title: string; sent_at: string };
    activities.push({
      id: `notification-${data.id}`,
      message: `Notification sent: ${data.title}`,
      createdAt: data.sent_at,
      color: "#ffb347",
      type: "notification",
    });
  });

  (auditRecentRes.data ?? []).forEach((row) => {
    const data = row as { id: string; action: string; created_at: string };
    activities.push({
      id: `audit-${data.id}`,
      message: `Admin action: ${data.action.replace(/_/g, " ")}`,
      createdAt: data.created_at,
      color: "#9b7fef",
      type: "audit",
    });
  });

  activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json(
    {
      summary,
      growth,
      recentActivity: activities.slice(0, 8),
    },
    { status: 200 }
  );
}
