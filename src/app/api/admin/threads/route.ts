import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ThreadInput = {
  id?: string;
  title?: string;
  content?: string;
  category?: string;
  market?: "forex" | "crypto" | "stocks";
  imageUrl?: string;
};

const MARKET_VALUES = ["forex", "crypto", "stocks"] as const;

const ensurePortalAccess = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, authorized: false, status: 401 as const, error: "Authentication required." };

  const [{ data: roleRows }, { data: profile }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", user.id),
    supabase.from("profiles").select("role, is_verified_analyst, display_name").eq("id", user.id).maybeSingle(),
  ]);

  const roles = (roleRows ?? []).map((row) => row.role);
  const isAdmin = roles.includes("admin") || profile?.role === "admin";
  const isVa = roles.includes("va") || profile?.is_verified_analyst === true || profile?.role === "analyst";
  if (!isAdmin && !isVa) {
    return { supabase, user, authorized: false, status: 403 as const, error: "Admin or VA role required." };
  }

  return { supabase, user, authorized: true as const, isAdmin, displayName: profile?.display_name ?? "Anonymous" };
};

export async function GET() {
  const access = await ensurePortalAccess();
  if (!access.authorized) return NextResponse.json({ error: access.error }, { status: access.status });

  let query = access.supabase
    .from("forum_threads")
    .select("id, author_id, title, category, market, image_url, content, is_archived, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(200);

  if (!access.isAdmin) query = query.eq("author_id", access.user?.id ?? "");

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Unable to load threads." }, { status: 500 });

  const authorIds = Array.from(new Set((data ?? []).map((row) => row.author_id as string)));
  const { data: profiles } = authorIds.length
    ? await access.supabase.from("profiles").select("id, display_name").in("id", authorIds)
    : { data: [] as Array<{ id: string; display_name: string | null }> };
  const names = new Map((profiles ?? []).map((p) => [p.id as string, p.display_name ?? "Anonymous"]));

  return NextResponse.json(
    {
      threads: (data ?? []).map((row) => ({
        id: row.id,
        authorId: row.author_id,
        authorName: names.get(row.author_id as string) ?? "Anonymous",
        title: row.title,
        category: row.category,
        market: row.market,
        imageUrl: row.image_url ?? undefined,
        content: row.content,
        isArchived: Boolean(row.is_archived),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    },
    { status: 200 }
  );
}

export async function POST(request: NextRequest) {
  const access = await ensurePortalAccess();
  if (!access.authorized) return NextResponse.json({ error: access.error }, { status: access.status });
  const body = (await request.json()) as ThreadInput;
  const title = body.title?.trim();
  const content = body.content?.trim();
  const category = body.category?.trim() || "general";
  const market = body.market?.trim() ?? "";
  const imageUrl = body.imageUrl?.trim() || null;

  if (!title || !content || title.length < 5 || content.length < 10) {
    return NextResponse.json({ error: "Thread title/content is too short." }, { status: 422 });
  }
  if (!MARKET_VALUES.includes(market as (typeof MARKET_VALUES)[number])) {
    return NextResponse.json({ error: "Market must be crypto, forex, or stocks." }, { status: 422 });
  }

  const { data, error } = await access.supabase
    .from("forum_threads")
    .insert({ author_id: access.user?.id, title, content, category, market, image_url: imageUrl, is_archived: false })
    .select("id, author_id, title, category, market, image_url, content, is_archived, created_at, updated_at")
    .single();

  if (error || !data) return NextResponse.json({ error: "Unable to create thread." }, { status: 500 });
  return NextResponse.json({ thread: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const access = await ensurePortalAccess();
  if (!access.authorized) return NextResponse.json({ error: access.error }, { status: access.status });
  const body = (await request.json()) as ThreadInput & { action?: "archive" | "unarchive" };
  if (!body.id) return NextResponse.json({ error: "Thread id is required." }, { status: 400 });

  const { data: existing } = await access.supabase.from("forum_threads").select("id, author_id").eq("id", body.id).maybeSingle();
  if (!existing) return NextResponse.json({ error: "Thread not found." }, { status: 404 });
  if (!access.isAdmin && existing.author_id !== access.user?.id) {
    return NextResponse.json({ error: "Only thread owner can modify this thread." }, { status: 403 });
  }

  const updatePayload: Record<string, unknown> = {};
  if (typeof body.title === "string") updatePayload.title = body.title.trim();
  if (typeof body.content === "string") updatePayload.content = body.content.trim();
  if (typeof body.category === "string") updatePayload.category = body.category.trim() || "general";
  if (typeof body.market === "string" && MARKET_VALUES.includes(body.market)) updatePayload.market = body.market;
  if (typeof body.imageUrl === "string") updatePayload.image_url = body.imageUrl.trim() || null;
  if (body.action === "archive") updatePayload.is_archived = true;
  if (body.action === "unarchive") updatePayload.is_archived = false;

  const { data, error } = await access.supabase
    .from("forum_threads")
    .update(updatePayload)
    .eq("id", body.id)
    .select("id, author_id, title, category, market, image_url, content, is_archived, created_at, updated_at")
    .single();

  if (error || !data) return NextResponse.json({ error: "Unable to update thread." }, { status: 500 });
  return NextResponse.json({ thread: data }, { status: 200 });
}

export async function DELETE(request: NextRequest) {
  const access = await ensurePortalAccess();
  if (!access.authorized) return NextResponse.json({ error: access.error }, { status: access.status });
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Thread id is required." }, { status: 400 });

  const { data: existing } = await access.supabase.from("forum_threads").select("id, author_id").eq("id", id).maybeSingle();
  if (!existing) return NextResponse.json({ error: "Thread not found." }, { status: 404 });
  if (!access.isAdmin && existing.author_id !== access.user?.id) {
    return NextResponse.json({ error: "Only thread owner can delete this thread." }, { status: 403 });
  }

  const { error } = await access.supabase.from("forum_threads").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Unable to delete thread." }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 200 });
}
