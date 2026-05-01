import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AnswerInput = {
  questionDate: string;
  questionId: string;
  correct: boolean;
  xp: number;
};

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = (await request.json()) as AnswerInput;
  if (!body?.questionDate || !body?.questionId) {
    return NextResponse.json({ error: "questionDate and questionId required." }, { status: 400 });
  }

  const xpAward = body.correct ? Math.max(0, Math.round(body.xp ?? 0)) : 0;

  const { data: inserted, error: insertError } = await supabase
    .from("academy_daily_answers")
    .insert({
      user_id: user.id,
      question_date: body.questionDate,
      question_id: body.questionId,
      correct: body.correct,
      xp_awarded: xpAward,
    })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ alreadyAnswered: true, xpAwarded: 0 }, { status: 200 });
    }
    return NextResponse.json({ error: "Unable to record answer." }, { status: 500 });
  }

  if (!inserted || xpAward === 0) {
    return NextResponse.json({ alreadyAnswered: false, xpAwarded: 0 }, { status: 200 });
  }

  const { data: progress, error: progressError } = await supabase
    .from("academy_progress")
    .select("user_id, xp, completed_lessons, streak_days")
    .eq("user_id", user.id)
    .single();

  if (progressError && progressError.code !== "PGRST116") {
    return NextResponse.json({ error: "Unable to update XP." }, { status: 500 });
  }

  const nextXp = Math.max(0, (progress?.xp ?? 0) + xpAward);
  const nextCompleted = Math.max(0, (progress?.completed_lessons ?? 0) + 1);

  const { data: updated, error: updateError } = await supabase
    .from("academy_progress")
    .upsert(
      {
        user_id: user.id,
        xp: nextXp,
        completed_lessons: nextCompleted,
        streak_days: progress?.streak_days ?? 0,
      },
      { onConflict: "user_id" }
    )
    .select("xp")
    .single();

  if (updateError || !updated) {
    return NextResponse.json({ error: "Unable to update XP." }, { status: 500 });
  }

  await supabase.from("profiles").update({ xp: updated.xp }).eq("id", user.id);

  return NextResponse.json({ alreadyAnswered: false, xpAwarded: xpAward, xpTotal: updated.xp }, { status: 200 });
}
