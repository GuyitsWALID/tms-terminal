import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type NotificationRow = {
  id: string;
  title: string;
  message: string;
  audience: "all" | "analysts" | "admins";
  type: "info" | "warning" | "critical";
  sent_at: string;
};

type NotificationInput = {
  title?: string;
  message?: string;
  audience?: "all" | "analysts" | "admins";
  type?: "info" | "warning" | "critical";
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
    .from("admin_notifications")
    .select("id, title, message, audience, type, sent_at")
    .order("sent_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: "Unable to load notifications." }, { status: 500 });
  }

  return NextResponse.json({ notifications: (data ?? []) as NotificationRow[] }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const access = await ensureAdmin();
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const input = (await request.json()) as NotificationInput;
  const title = input.title?.trim();
  const message = input.message?.trim();
  const audience = input.audience ?? "all";
  const type = input.type ?? "info";

  if (!title || !message) {
    return NextResponse.json({ error: "Title and message are required." }, { status: 400 });
  }

  const { data, error } = await access.supabase
    .from("admin_notifications")
    .insert({
      title,
      message,
      audience,
      type,
      sent_by: access.user?.id ?? null,
    })
    .select("id, title, message, audience, type, sent_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Unable to send notification." }, { status: 500 });
  }

  await access.supabase.from("admin_audit_logs").insert({
    actor_id: access.user?.id ?? null,
    action: "notification_sent",
    target_type: "admin_notifications",
    target_id: data.id,
    payload: { audience, type, title },
  });

  return NextResponse.json({ notification: data as NotificationRow }, { status: 201 });
}
