import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CreateThreadInput = {
  title?: string;
  content?: string;
  category?: string;
};

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const { data: threads, error } = await supabase
    .from("forum_threads")
    .select("id, author_id, title, category, content, is_pinned, created_at, updated_at")
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(50);

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

  if (!title || title.length < 5 || !content || content.length < 10) {
    return NextResponse.json({ error: "Thread title/content is too short." }, { status: 422 });
  }

  const { data: row, error } = await supabase
    .from("forum_threads")
    .insert({
      author_id: user.id,
      title,
      category,
      content,
      is_pinned: false,
    })
    .select("id, author_id, title, category, content, is_pinned, created_at, updated_at")
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
        content: row.content,
        isPinned: row.is_pinned,
        authorId: row.author_id,
        authorName: user.email ?? "Anonymous",
        authorRole: "user",
        authorIsVerifiedAnalyst: false,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    },
    { status: 201 }
  );
}
