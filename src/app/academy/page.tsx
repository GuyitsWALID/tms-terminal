"use client";

import { useMemo, useState } from "react";
import { Brain, Trophy } from "lucide-react";
import { academyQuestions } from "@/lib/terminalData";

export default function AcademyPage() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [xp, setXp] = useState(1240);

  const question = academyQuestions[questionIndex];
  const answered = selectedIndex !== null;
  const isCorrect = selectedIndex === question.answerIndex;

  const progress = useMemo(() => ((questionIndex + 1) / academyQuestions.length) * 100, [questionIndex]);

  const submitAnswer = (index: number) => {
    if (answered) return;
    setSelectedIndex(index);
    if (index === question.answerIndex) {
      setXp((current) => current + question.xp);
    }
  };

  const nextQuestion = () => {
    if (questionIndex === academyQuestions.length - 1) {
      setQuestionIndex(0);
    } else {
      setQuestionIndex((current) => current + 1);
    }
    setSelectedIndex(null);
  };

  return (
    <div className="space-y-3">
      <div className="ff-panel p-4">
        <h1 className="font-rajdhani text-3xl font-bold uppercase leading-none">Academy XP Arena</h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">Gamified macro training with AI-generated fundamentals and progression rewards.</p>
      </div>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="ff-panel p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="ff-panel-title text-xs text-[var(--ink-muted)]">Topic</p>
              <p className="font-semibold text-[var(--ink-primary)]">{question.topic}</p>
            </div>
            <span className="rounded border border-[var(--line-strong)] bg-[var(--surface-1)] px-2 py-1 text-xs font-bold text-[var(--ink-primary)]">+{question.xp} XP</span>
          </div>

          <h2 className="text-lg font-semibold text-[var(--ink-primary)]">{question.prompt}</h2>

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

          {answered ? (
            <div className="mt-3 rounded border border-[var(--line-strong)] bg-[var(--surface-3)] p-3 text-sm">
              <p className={`font-semibold ${isCorrect ? "text-[#2fd488]" : "text-[#ff8181]"}`}>
                {isCorrect ? "Correct. XP awarded." : "Not quite. Review the concept."}
              </p>
              <p className="mt-1 text-[var(--ink-muted)]">{question.explanation}</p>
              <button onClick={nextQuestion} className="mt-3 rounded bg-[var(--brand-strong)] px-3 py-2 text-xs font-bold uppercase tracking-wider text-white">
                Next Question
              </button>
            </div>
          ) : null}

          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs text-[var(--ink-muted)]">
              <span>Module Progress</span>
              <span>{questionIndex + 1}/{academyQuestions.length}</span>
            </div>
            <div className="h-2 overflow-hidden rounded bg-[var(--surface-1)]">
              <div className="h-full bg-[var(--brand)]" style={{ width: `${progress}%` }} />
            </div>
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
            <div className="mb-2 flex items-center gap-2 text-[var(--ink-primary)]">
              <Brain size={14} />
              <h3 className="ff-panel-title text-sm">Learning Loop</h3>
            </div>
            <ul className="space-y-1 text-xs text-[var(--ink-muted)]">
              <li>- AI generates question themes from current macro calendar.</li>
              <li>- Correct answers grant XP and unlock new modules.</li>
              <li>- Weak topics are recycled in adaptive review rounds.</li>
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}



