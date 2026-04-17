import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CreateReplyInput = {
  threadId?: string;
  content?: string;
};

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const threadId = request.nextUrl.searchParams.get("threadId")?.trim();

  let query = supabase
    .from("forum_replies")
    .select("id, thread_id, author_id, content, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (threadId) query = query.eq("thread_id", threadId);

  const { data: replies, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Unable to load forum replies." }, { status: 500 });
  }

  const authorIds = Array.from(new Set((replies ?? []).map((reply) => reply.author_id as string)));

  let profilesMap = new Map<string, string>();
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase.from("profiles").select("id, display_name").in("id", authorIds);
    profilesMap = new Map((profiles ?? []).map((profile) => [profile.id as string, (profile.display_name as string | null) ?? "Anonymous"]));
  }

  return NextResponse.json(
    {
      replies: (replies ?? []).map((reply) => ({
        id: reply.id,
        threadId: reply.thread_id,
        authorId: reply.author_id,
        authorName: profilesMap.get(reply.author_id as string) ?? "Anonymous",
        content: reply.content,
        createdAt: reply.created_at,
        updatedAt: reply.updated_at,
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

  const body = (await request.json()) as CreateReplyInput;
  const threadId = body.threadId?.trim();
  const content = body.content?.trim();

  if (!threadId || !content || content.length < 3) {
    return NextResponse.json({ error: "Reply payload is invalid." }, { status: 422 });
  }

  const { data: row, error } = await supabase
    .from("forum_replies")
    .insert({
      thread_id: threadId,
      author_id: user.id,
      content,
    })
    .select("id, thread_id, author_id, content, created_at, updated_at")
    .single();

  if (error || !row) {
    return NextResponse.json({ error: "Unable to post reply." }, { status: 500 });
  }

  return NextResponse.json(
    {
      reply: {
        id: row.id,
        threadId: row.thread_id,
        authorId: row.author_id,
        authorName: user.email ?? "Anonymous",
        content: row.content,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    },
    { status: 201 }
  );
}
