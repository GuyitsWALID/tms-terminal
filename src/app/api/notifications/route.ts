import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { HeaderNotificationItem } from "@/types";

type SystemNoticeRow = {
  id: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  is_active: boolean;
  created_at: string;
};

const toIso = () => new Date().toISOString();

const buildGuestNotifications = (): HeaderNotificationItem[] => [
  {
    id: "guest-signin-reminder",
    kind: "guest-reminder",
    title: "Sign in required",
    message: "Sign in or create an account to enable unread notifications, reminders, and personalized alerts.",
    actionHref: "/login",
    severity: "info",
    createdAt: toIso(),
  },
];

const buildReminderNotifications = (isEmailVerified: boolean, permission: string): HeaderNotificationItem[] => {
  const reminders: HeaderNotificationItem[] = [];

  if (!isEmailVerified) {
    reminders.push({
      id: "email-verification-required",
      kind: "email-verification",
      title: "Email address not verified",
      message: "Verify your email address to secure your account and enable important account notifications.",
      actionHref: "/profile",
      severity: "warning",
      createdAt: toIso(),
    });
  }

  if (permission === "denied") {
    reminders.push({
      id: "browser-notification-disabled",
      kind: "browser-permission",
      title: "Browser notifications are disabled",
      message: "Enable browser notifications to receive reminders and urgent market/system alerts.",
      actionHref: "/profile",
      severity: "warning",
      createdAt: toIso(),
    });
  }

  if (permission === "default") {
    reminders.push({
      id: "browser-notification-not-granted",
      kind: "browser-permission",
      title: "Allow browser notifications",
      message: "Grant browser notification permission to receive alert popups in real time.",
      actionHref: "/profile",
      severity: "info",
      createdAt: toIso(),
    });
  }

  return reminders;
};

const loadSystemNotices = async (supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) => {
  try {
    const { data, error } = await supabase
      .from("system_notices")
      .select("id, title, message, severity, is_active, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error || !data) return [] as HeaderNotificationItem[];

    return (data as SystemNoticeRow[]).map((notice) => ({
      id: `system-${notice.id}`,
      kind: "system-notice",
      title: notice.title,
      message: notice.message,
      severity: notice.severity,
      createdAt: notice.created_at,
    }));
  } catch {
    return [] as HeaderNotificationItem[];
  }
};

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const permission = new URL(request.url).searchParams.get("permission") ?? "default";

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const guestItems = buildGuestNotifications();
    return NextResponse.json(
      {
        isAuthenticated: false,
        items: guestItems,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const systemNotices = await loadSystemNotices(supabase);
  const reminders = buildReminderNotifications(Boolean(user.email_confirmed_at), permission);
  const items = [...reminders, ...systemNotices].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  return NextResponse.json(
    {
      isAuthenticated: true,
      items,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
