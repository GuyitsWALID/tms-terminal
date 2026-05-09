import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CreateThreadInput = {
  title?: string;
  content?: string;
  category?: string;
  market?: "forex" | "crypto" | "stocks";
  imageUrl?: string;
};

const MARKET_VALUES = ["forex", "crypto", "stocks"] as const;

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const market = request.nextUrl.searchParams.get("market")?.trim() ?? "";

  let query = supabase
    .from("forum_threads")
    .select("id, author_id, title, category, market, image_url, content, is_pinned, is_archived, created_at, updated_at")
    .eq("is_archived", false)
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(50);

  if (MARKET_VALUES.includes(market as (typeof MARKET_VALUES)[number])) {
    query = query.eq("market", market);
  }

  const { data: threads, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Unable to load forum threads." }, { status: 500 });
  }

  const authorIds = Array.from(new Set((threads ?? []).map((thread) => thread.author_id as string)));

  let profilesMap = new Map<string, { name: string; role: "user" | "analyst" | "admin"; isVerifiedAnalyst: boolean }>();
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase.from("profiles").select("id, display_name, role, is_verified_analyst").in("id", authorIds);
    profilesMap = new Map(
      (profiles ?? []).map((profile) => [
        profile.id as string,
        {
          name: (profile.display_name as string | null) ?? "Anonymous",
          role: (profile.role as "user" | "analyst" | "admin") ?? "user",
          isVerifiedAnalyst: Boolean(profile.is_verified_analyst),
        },
      ])
    );
  }

  return NextResponse.json(
    {
      threads: (threads ?? []).map((thread) => ({
        id: thread.id,
        title: thread.title,
        category: thread.category,
        market: thread.market,
        imageUrl: thread.image_url ?? undefined,
        content: thread.content,
        isPinned: thread.is_pinned,
        authorId: thread.author_id,
        authorName: profilesMap.get(thread.author_id as string)?.name ?? "Anonymous",
        authorRole: profilesMap.get(thread.author_id as string)?.role ?? "user",
        authorIsVerifiedAnalyst: profilesMap.get(thread.author_id as string)?.isVerifiedAnalyst ?? false,
        createdAt: thread.created_at,
        updatedAt: thread.updated_at,
      })),
    },
    { status: 200 }
  );
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = (await request.json()) as CreateThreadInput;
  const title = body.title?.trim();
  const content = body.content?.trim();
  const category = body.category?.trim() || "general";
  const market = body.market?.trim() ?? "";
  const imageUrl = body.imageUrl?.trim() || null;

  if (!MARKET_VALUES.includes(market as (typeof MARKET_VALUES)[number])) {
    return NextResponse.json({ error: "Market must be crypto, forex, or stocks." }, { status: 422 });
  }

  if (!title || title.length < 5 || !content || content.length < 10) {
    return NextResponse.json({ error: "Thread title/content is too short." }, { status: 422 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_verified_analyst, role")
    .eq("id", user.id)
    .maybeSingle();

  const isVerifiedAnalyst = Boolean(profile?.is_verified_analyst);
  const isAdmin = profile?.role === "admin";

  if (!isVerifiedAnalyst && !isAdmin) {
    return NextResponse.json({ error: "Verified analysts only can create threads." }, { status: 403 });
  }

  const { data: row, error } = await supabase
    .from("forum_threads")
    .insert({
      author_id: user.id,
      title,
      category,
      market,
      image_url: imageUrl,
      content,
      is_pinned: false,
    })
    .select("id, author_id, title, category, market, image_url, content, is_pinned, created_at, updated_at")
    .single();

  if (error || !row) {
    return NextResponse.json({ error: "Unable to create thread." }, { status: 500 });
  }

  return NextResponse.json(
    {
      thread: {
        id: row.id,
        title: row.title,
        category: row.category,
        market: row.market,
        imageUrl: row.image_url ?? undefined,
        content: row.content,
        isPinned: row.is_pinned,
        authorId: row.author_id,
        authorName: user.email ?? "Anonymous",
        authorRole: isAdmin ? "admin" : "analyst",
        authorIsVerifiedAnalyst: isVerifiedAnalyst,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    },
    { status: 201 }
  );
}
