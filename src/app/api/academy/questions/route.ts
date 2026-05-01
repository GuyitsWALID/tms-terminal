import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DailyQuestion = {
  id: string;
  topic: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  xp: number;
};

type GroqQuestionResponse = {
  questions: DailyQuestion[];
};

const GROQ_MODELS = ["llama-3.1-70b-versatile", "llama-3.1-8b-instant"];

const buildPrompt = () => {
  return {
    system: "You generate daily multiple-choice fundamental market questions. Always return strict JSON only.",
    user: [
      "Create 3 fundamental market questions for traders.",
      "Each question must be multiple-choice with 4 options and exactly one correct answer.",
      "Topics should be macro/fundamental (rates, inflation, growth, central banks, FX flows).",
      "Provide brief explanations.",
      "Return JSON with shape: {\"questions\":[{\"id\":string,\"topic\":string,\"prompt\":string,\"options\":[string,string,string,string],\"answerIndex\":number,\"explanation\":string,\"xp\":number}]}",
      "Use numeric ids like q1, q2, q3.",
      "xp values should be 80-140.",
    ].join(" "),
  };
};

const isValidQuestion = (q: DailyQuestion) => {
  return (
    typeof q.id === "string" &&
    typeof q.topic === "string" &&
    typeof q.prompt === "string" &&
    Array.isArray(q.options) &&
    q.options.length === 4 &&
    Number.isInteger(q.answerIndex) &&
    q.answerIndex >= 0 &&
    q.answerIndex < 4 &&
    typeof q.explanation === "string" &&
    Number.isFinite(q.xp)
  );
};

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const today = new Date();
  const dateKey = today.toISOString().slice(0, 10);

  const { data: existing, error: existingError } = await supabase
    .from("academy_daily_questions")
    .select("question_date, questions")
    .eq("question_date", dateKey)
    .maybeSingle();

  if (existingError && existingError.code !== "PGRST116") {
    return NextResponse.json({ error: "Unable to load questions." }, { status: 500 });
  }

  if (existing?.questions) {
    return NextResponse.json({ date: dateKey, questions: existing.questions });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing GROQ_API_KEY." }, { status: 500 });
  }

  const prompt = buildPrompt();

  let content = "";
  let lastError: string | null = null;

  for (const model of GROQ_MODELS) {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.6,
        messages: [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!groqRes.ok) {
      const errorBody = await groqRes.text().catch(() => "");
      lastError = `Groq ${model} failed: ${groqRes.status} ${groqRes.statusText} ${errorBody}`.trim();
      continue;
    }

    const groqPayload = (await groqRes.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    content = groqPayload.choices?.[0]?.message?.content ?? "";
    if (content) {
      break;
    }
  }

  if (!content) {
    return NextResponse.json(
      { error: "Unable to generate questions.", detail: lastError ?? "No response from Groq." },
      { status: 502 }
    );
  }
  let parsed: GroqQuestionResponse | null = null;

  try {
    parsed = JSON.parse(content) as GroqQuestionResponse;
  } catch {
    return NextResponse.json({ error: "Invalid question payload." }, { status: 500 });
  }

  const questions = (parsed?.questions ?? []).filter(isValidQuestion).slice(0, 3);
  if (questions.length !== 3) {
    return NextResponse.json({ error: "Invalid question set." }, { status: 500 });
  }

  await supabase.rpc("upsert_academy_daily_questions", {
    q_date: dateKey,
    q_questions: questions,
  });

  return NextResponse.json({ date: dateKey, questions });
}
