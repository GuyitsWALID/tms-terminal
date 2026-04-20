import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ProgressUpdateInput = {
  xpDelta?: number;
  completedLessonsDelta?: number;
  streakDays?: number;
};

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("academy_progress")
    .select("user_id, xp, completed_lessons, streak_days, updated_at")
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: "Unable to load academy progress." }, { status: 500 });
  }

  if (!data) {
    const { data: inserted, error: insertError } = await supabase
      .from("academy_progress")
      .insert({ user_id: user.id, xp: 0, completed_lessons: 0, streak_days: 0 })
      .select("user_id, xp, completed_lessons, streak_days, updated_at")
      .single();

    if (insertError || !inserted) {
      return NextResponse.json({ error: "Unable to initialize academy progress." }, { status: 500 });
    }

    return NextResponse.json(
      {
        progress: {
          userId: inserted.user_id,
          xp: inserted.xp,
          completedLessons: inserted.completed_lessons,
          streakDays: inserted.streak_days,
          updatedAt: inserted.updated_at,
        },
      },
      { status: 200 }
    );
  }

  return NextResponse.json(
    {
      progress: {
        userId: data.user_id,
        xp: data.xp,
        completedLessons: data.completed_lessons,
        streakDays: data.streak_days,
        updatedAt: data.updated_at,
      },
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

  const body = (await request.json()) as ProgressUpdateInput;
  const xpDelta = Number.isFinite(body.xpDelta) ? Math.round(body.xpDelta ?? 0) : 0;
  const completedLessonsDelta = Number.isFinite(body.completedLessonsDelta) ? Math.round(body.completedLessonsDelta ?? 0) : 0;

  const { data: existing, error: existingError } = await supabase
    .from("academy_progress")
    .select("user_id, xp, completed_lessons, streak_days")
    .eq("user_id", user.id)
    .single();

  if (existingError && existingError.code !== "PGRST116") {
    return NextResponse.json({ error: "Unable to load academy progress." }, { status: 500 });
  }

  const nextXp = Math.max(0, (existing?.xp ?? 0) + xpDelta);
  const nextCompletedLessons = Math.max(0, (existing?.completed_lessons ?? 0) + completedLessonsDelta);
  const nextStreakDays = body.streakDays ?? existing?.streak_days ?? 0;

  const { data: upserted, error: upsertError } = await supabase
    .from("academy_progress")
    .upsert(
      {
        user_id: user.id,
        xp: nextXp,
        completed_lessons: nextCompletedLessons,
        streak_days: nextStreakDays,
      },
      { onConflict: "user_id" }
    )
    .select("user_id, xp, completed_lessons, streak_days, updated_at")
    .single();

  if (upsertError || !upserted) {
    return NextResponse.json({ error: "Unable to update academy progress." }, { status: 500 });
  }

  await supabase
    .from("profiles")
    .update({ xp: upserted.xp })
    .eq("id", user.id);

  return NextResponse.json(
    {
      progress: {
        userId: upserted.user_id,
        xp: upserted.xp,
        completedLessons: upserted.completed_lessons,
        streakDays: upserted.streak_days,
        updatedAt: upserted.updated_at,
      },
    },
    { status: 200 }
  );
}
