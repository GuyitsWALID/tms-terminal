import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type MonthlyDatum = {
  month: string;
  users: number;
  invitesUsed: number;
  complaints: number;
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
  const months: { key: string; label: string; start: Date; end: Date }[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const label = start.toLocaleString("en-US", { month: "short" });
    const key = `${start.getFullYear()}-${start.getMonth() + 1}`;
    months.push({ key, label, start, end });
  }
  return months;
};

const countByMonth = (rows: { created_at: string }[], months: ReturnType<typeof buildMonths>) => {
  const counts = new Map(months.map((m) => [m.key, 0]));
  rows.forEach((row) => {
    const date = new Date(row.created_at);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    if (counts.has(key)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  });
  return months.map((m) => ({ key: m.key, label: m.label, count: counts.get(m.key) ?? 0 }));
};

export async function GET() {
  const access = await ensureAdmin();
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const months = buildMonths();
  const startDate = months[0].start.toISOString();

  const [usersRes, inviteRes, complaintRes] = await Promise.all([
    access.supabase.from("profiles").select("created_at").gte("created_at", startDate),
    access.supabase.from("invite_redemptions").select("created_at").gte("created_at", startDate),
    access.supabase.from("forum_complaints").select("created_at").gte("created_at", startDate),
  ]);

  if (usersRes.error || inviteRes.error || complaintRes.error) {
    return NextResponse.json({ error: "Unable to load analytics." }, { status: 500 });
  }

  const userCounts = countByMonth((usersRes.data ?? []) as { created_at: string }[], months);
  const inviteCounts = countByMonth((inviteRes.data ?? []) as { created_at: string }[], months);
  const complaintCounts = countByMonth((complaintRes.data ?? []) as { created_at: string }[], months);

  const monthly: MonthlyDatum[] = months.map((month, index) => ({
    month: month.label,
    users: userCounts[index]?.count ?? 0,
    invitesUsed: inviteCounts[index]?.count ?? 0,
    complaints: complaintCounts[index]?.count ?? 0,
  }));

  return NextResponse.json({ monthly }, { status: 200 });
}
