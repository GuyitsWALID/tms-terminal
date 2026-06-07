"use client";

import { useEffect, useMemo, useState } from "react";
import { Brain, Trophy } from "lucide-react";
import { fetchAuthStatus } from "@/lib/api/dataService";

type DailyQuestion = {
  id: string;
  topic: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  xp: number;
};

type RankBand = {
  name: string;
  minXp: number;
  maxXp: number;
};

const RANKS: RankBand[] = [
  { name: "Novice", minXp: 0, maxXp: 499 },
  { name: "Apprentice", minXp: 500, maxXp: 1199 },
  { name: "Analyst", minXp: 1200, maxXp: 1999 },
  { name: "Strategist", minXp: 2000, maxXp: 2999 },
  { name: "Macro Pro", minXp: 3000, maxXp: 4499 },
  { name: "Chief Economist", minXp: 4500, maxXp: 999999 },
];

const getRank = (xpValue: number) => {
  return RANKS.find((rank) => xpValue >= rank.minXp && xpValue <= rank.maxXp) ?? RANKS[0];
};

const getNextRank = (xpValue: number) => {
  const current = getRank(xpValue);
  const index = RANKS.findIndex((r) => r.name === current.name);
  return RANKS[Math.min(index + 1, RANKS.length - 1)];
};

export default function AcademyPage() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<DailyQuestion[]>([]);
  const [questionsDate, setQuestionsDate] = useState<string>("");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [xp, setXp] = useState(1240);
  const [dailyScore, setDailyScore] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [academyStatus, setAcademyStatus] = useState<string>("");
  const [questionStatus, setQuestionStatus] = useState<string>("");

  const question = questions[questionIndex];
  const answered = selectedIndex !== null;
  const isCorrect = selectedIndex === question?.answerIndex;
  const isComplete = questions.length > 0 && answeredCount >= questions.length;

  const progress = useMemo(() => {
    if (questions.length === 0) return 0;
    return ((questionIndex + 1) / questions.length) * 100;
  }, [questionIndex, questions.length]);

  const rank = useMemo(() => getRank(xp), [xp]);
  const nextRank = useMemo(() => getNextRank(xp), [xp]);
  const rankProgress = useMemo(() => {
    if (nextRank.name === rank.name) return 100;
    return Math.min(100, Math.round(((xp - rank.minXp) / (nextRank.minXp - rank.minXp)) * 100));
  }, [rank, nextRank, xp]);

  useEffect(() => {
    let mounted = true;

    const hydrateProgress = async () => {
      try {
        const authStatus = await fetchAuthStatus();
        if (!mounted) return;
        setIsAuthenticated(authStatus.isAuthenticated);

        if (!authStatus.isAuthenticated) {
          setAcademyStatus("Sign in to persist XP progress.");
          return;
        }

        const progressRes = await fetch("/api/academy/progress", { cache: "no-store" });
        if (!progressRes.ok) {
          setAcademyStatus("Unable to load persisted XP. Using local session XP.");
          return;
        }

        const payload = (await progressRes.json()) as { progress: { xp: number } };
        if (!mounted) return;
        setXp(payload.progress.xp ?? 0);
        setAcademyStatus("XP is synced with your account.");
      } catch {
        if (!mounted) return;
        setAcademyStatus("Unable to reach academy backend. Using local session XP.");
      }
    };

    const loadQuestions = async () => {
      try {
        setQuestionStatus("Loading daily fundamentals...");
        const res = await fetch("/api/academy/questions", { cache: "no-store" });
        if (!res.ok) {
          setQuestionStatus("Unable to load daily questions.");
          return;
        }
        const payload = (await res.json()) as { date: string; questions: DailyQuestion[] };
        if (!mounted) return;
        setQuestions(payload.questions ?? []);
        setQuestionsDate(payload.date ?? "");
        setQuestionIndex(0);
        setSelectedIndex(null);
        setDailyScore(0);
        setAnsweredCount(0);
        setQuestionStatus("");
      } catch {
        if (!mounted) return;
        setQuestionStatus("Unable to reach the academy questions service.");
      }
    };

    void hydrateProgress();
    void loadQuestions();

    return () => {
      mounted = false;
    };
  }, []);

  const submitAnswer = (index: number) => {
    if (answered) return;
    if (!question) return;
    setSelectedIndex(index);
    setAnsweredCount((count) => Math.min(questions.length, count + 1));
    const correct = index === question.answerIndex;
    if (!correct) return;

    const nextXp = xp + question.xp;
    setXp(nextXp);
    setDailyScore((score) => score + question.xp);

    if (isAuthenticated) {
      void fetch("/api/academy/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionDate: questionsDate,
          questionId: question.id,
          correct: true,
          xp: question.xp,
        }),
      }).then(async (res) => {
        if (!res.ok) return;
        const payload = (await res.json()) as { xpTotal?: number };
        if (typeof payload.xpTotal === "number") {
          setXp(payload.xpTotal);
        }
      });
    }
  };

  const nextQuestion = () => {
    if (isComplete) return;
    if (questionIndex === questions.length - 1) {
      setQuestionIndex(questionIndex);
    } else {
      setQuestionIndex((current) => current + 1);
    }
    setSelectedIndex(null);
  };

  return (
    <div className="space-y-3">
      <div className="ff-panel p-4">
        <h1 className="font-rajdhani text-2xl font-bold uppercase leading-none sm:text-3xl">Academy XP Arena</h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Daily fundamentals practice with macro concepts, risk vocabulary, and progression rewards.
        </p>
        <p className="mt-1 text-xs leading-5 text-[var(--ink-muted)]">
          Academy material is educational. Always verify current data, market conditions, and event timing before making decisions.
        </p>
        {academyStatus ? <p className="mt-1 text-xs text-[var(--ink-muted)]">{academyStatus}</p> : null}
      </div>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="ff-panel p-4 relative overflow-hidden">
          {isComplete ? (
            <div className="absolute inset-0 pointer-events-none">
              <div className="academy-confetti">
                {Array.from({ length: 24 }).map((_, index) => (
                  <span
                    key={index}
                    className="academy-confetti-piece"
                    style={{
                      left: `${(index * 7) % 100}%`,
                      animationDelay: `${(index % 6) * 0.12}s`,
                      backgroundColor: ["#ffb347", "#5de6a7", "#8fd3ff", "#ff8a8f"][index % 4],
                    }}
                  />
                ))}
              </div>
            </div>
          ) : null}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="ff-panel-title text-xs text-[var(--ink-muted)]">Topic</p>
              <p className="font-semibold text-[var(--ink-primary)]">{question?.topic ?? "—"}</p>
            </div>
            <span className="rounded border border-[var(--line-strong)] bg-[var(--surface-1)] px-2 py-1 text-xs font-bold text-[var(--ink-primary)]">
              +{question?.xp ?? 0} XP
            </span>
          </div>

          <h2 className="text-lg font-semibold text-[var(--ink-primary)]">{question?.prompt ?? ""}</h2>

          {isComplete ? (
            <div className="mt-4 rounded border border-[#2fd48855] bg-[#1c4f43] p-4 text-sm text-[#e6fff6]">
              <p className="text-base font-semibold">Daily set complete.</p>
              <p className="mt-1 text-sm text-[#c9f5e2]">Total score: {dailyScore} XP</p>
              <p className="mt-2 text-xs text-[#c9f5e2]">Come back tomorrow for a new fundamentals set.</p>
              {!isAuthenticated ? (
                <p className="mt-2 text-xs text-[#ffd28e]">Sign in to keep your progress.</p>
              ) : null}
            </div>
          ) : question ? (
            <div className="mt-3 space-y-2">
              {question.options.map((option, index) => (
                <button
                  key={option}
                  onClick={() => submitAnswer(index)}
                  className={`w-full rounded border px-3 py-2 text-left text-sm transition ${
                    selectedIndex === index
                      ? index === question.answerIndex
                        ? "border-[#2fd488] bg-[#1c4f43] text-[#e6fff6]"
                        : "border-[#ff6a6a] bg-[#582b36] text-[#ffeef1]"
                      : "border-[var(--line-strong)] bg-[var(--surface-3)] text-[var(--ink-primary)] hover:bg-[var(--surface-hover)]"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded border border-[var(--line-strong)] bg-[var(--surface-3)] p-3 text-sm text-[var(--ink-muted)]">
              {questionStatus || "No questions available."}
            </div>
          )}

          {answered && !isComplete ? (
            <div className="mt-3 rounded border border-[var(--line-strong)] bg-[var(--surface-3)] p-3 text-sm">
              <p className={`font-semibold ${isCorrect ? "text-[#2fd488]" : "text-[#ff8181]"}`}>
                {isCorrect ? "Correct. XP awarded." : "Not quite. Review the concept."}
              </p>
              <p className="mt-1 text-[var(--ink-muted)]">{question?.explanation ?? ""}</p>
              <button onClick={nextQuestion} className="mt-3 rounded bg-[var(--brand-strong)] px-3 py-2 text-xs font-bold uppercase tracking-wider text-white">
                Next Question
              </button>
            </div>
          ) : null}

          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs text-[var(--ink-muted)]">
              <span>Module Progress</span>
              <span>{questions.length === 0 ? "0/0" : `${questionIndex + 1}/${questions.length}`}</span>
            </div>
            <div className="h-2 overflow-hidden rounded bg-[var(--surface-1)]">
              <div className="h-full bg-[var(--brand)]" style={{ width: `${progress}%` }} />
            </div>
            {questionsDate ? (
              <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                Daily set: {questionsDate}
              </p>
            ) : null}
          </div>
        </div>

        <aside className="space-y-3">
          <div className="ff-panel p-3">
            <div className="mb-2 flex items-center gap-2 text-[var(--ink-primary)]">
              <Trophy size={14} />
              <h3 className="ff-panel-title text-sm">Your Profile</h3>
            </div>
            <p className="font-rajdhani text-4xl leading-none text-[var(--ink-primary)]">{xp}</p>
            <p className="text-xs text-[var(--ink-muted)]">Current XP</p>
            <div className="mt-2 rounded border border-[var(--line-strong)] bg-[var(--surface-3)] p-2 text-xs text-[var(--ink-muted)]">
              Milestone: Reach 1500 XP to unlock advanced central bank scenarios.
            </div>
          </div>

          <div className="ff-panel p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[var(--ink-primary)]">
                <Trophy size={14} />
                <h3 className="ff-panel-title text-sm">Ranking</h3>
              </div>
              <span className="rounded border border-[var(--line-strong)] bg-[var(--surface-2)] px-2 py-1 text-[10px] font-bold uppercase text-[var(--ink-primary)]">
                {rank.name}
              </span>
            </div>
            <p className="text-xs text-[var(--ink-muted)]">
              Next: {nextRank.name} at {nextRank.minXp} XP
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded bg-[var(--surface-1)]">
              <div className="h-full bg-[var(--brand)]" style={{ width: `${rankProgress}%` }} />
            </div>
            <p className="mt-2 text-xs text-[var(--ink-muted)]">{rankProgress}% of the way to the next tier.</p>
          </div>

          <div className="ff-panel p-3">
            <div className="mb-2 flex items-center gap-2 text-[var(--ink-primary)]">
              <Brain size={14} />
              <h3 className="ff-panel-title text-sm">Learning Loop</h3>
            </div>
            <ul className="space-y-1 text-xs text-[var(--ink-muted)]">
              <li>- Daily fundamentals refresh every 24 hours.</li>
              <li>- Correct answers grant XP and unlock new modules.</li>
              <li>- Weak topics are recycled in adaptive review rounds.</li>
            </ul>
          </div>
        </aside>
      </section>
      <style jsx>{`
        .academy-confetti {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }
        .academy-confetti-piece {
          position: absolute;
          top: -8px;
          width: 8px;
          height: 14px;
          opacity: 0.9;
          border-radius: 2px;
          animation: fall 1.6s ease-in-out infinite;
        }
        @keyframes fall {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          100% {
            transform: translateY(320px) rotate(220deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}



