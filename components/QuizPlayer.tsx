"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Q = {
  id: number;
  question: string;
  choices: string[];
  answerIndex?: number; // ส่งมาเฉพาะตอนทำเสร็จแล้ว (locked) เพื่อเฉลย
  explanation?: string;
};
type GradeResult = {
  score: number;
  total: number;
  results: { id: number; correct: boolean; answerIndex: number; explanation: string }[];
};

const LABELS = ["ก", "ข", "ค", "ง", "จ", "ฉ"];

export default function QuizPlayer({
  lessonId,
  questions,
  locked,
}: {
  lessonId: number;
  questions: Q[];
  locked?: { score: number; total: number } | null;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [graded, setGraded] = useState<GradeResult | null>(null);
  const [loading, setLoading] = useState(false);

  if (questions.length === 0) return null;

  async function submit() {
    setLoading(true);
    try {
      const res = await fetch("/api/quiz-attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, answers }),
      });
      const data = await res.json();
      if (res.ok) {
        setGraded(data);
      }
      // ไม่ว่าจะสำเร็จหรือเคยทำไปแล้ว (409) — refresh ให้หน้าเปลี่ยนเป็นโหมดล็อก
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const allAnswered = questions.every((q) => answers[q.id] !== undefined);
  const score = locked?.score ?? graded?.score ?? 0;
  const total = locked?.total ?? graded?.total ?? questions.length;
  const isDone = !!locked || !!graded;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2 mb-1">
        <h2 className="font-bold text-lg">📝 แบบทดสอบท้ายบท</h2>
        <span className="shrink-0 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
          ทำได้ครั้งเดียว
        </span>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        {locked
          ? "คุณทำแบบทดสอบนี้ไปแล้ว — ดูเฉลยด้านล่างได้"
          : `${questions.length} ข้อ — เลือกคำตอบแล้วกดส่ง (ส่งได้ครั้งเดียว ตรวจให้ดีก่อนส่ง)`}
      </p>

      <div className="space-y-5">
        {questions.map((q, qi) => {
          const result = graded?.results.find((r) => r.id === q.id);
          // เฉลย: ใช้จากผลตรวจ (เพิ่งส่ง) หรือจาก answerIndex (โหมดล็อก)
          const correctIndex = result ? result.answerIndex : q.answerIndex;
          const explanation = result ? result.explanation : q.explanation;
          return (
            <div key={q.id}>
              <div className="font-medium mb-2">
                {qi + 1}. {q.question}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {q.choices.map((c, ci) => {
                  const chosen = answers[q.id] === ci;
                  let cls = chosen
                    ? "border-indigo-400 bg-indigo-50 text-indigo-800"
                    : "border-slate-200 bg-white hover:bg-slate-50";
                  if (isDone) {
                    if (ci === correctIndex) cls = "border-green-400 bg-green-50 text-green-800";
                    else if (chosen && ci !== correctIndex) cls = "border-rose-400 bg-rose-50 text-rose-800";
                    else cls = "border-slate-200 bg-white opacity-60";
                  }
                  return (
                    <button
                      key={ci}
                      disabled={isDone}
                      onClick={() => setAnswers((a) => ({ ...a, [q.id]: ci }))}
                      className={`text-left text-sm border rounded-xl px-3 py-2.5 ${cls}`}
                    >
                      {LABELS[ci] ? `${LABELS[ci]}. ${c}` : c}
                      {isDone && ci === correctIndex && " ✓"}
                    </button>
                  );
                })}
              </div>
              {isDone && explanation && (
                <div className="mt-2 text-sm rounded-lg px-3 py-2 bg-slate-50 text-slate-600">
                  💡 {explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5">
        {!isDone ? (
          <button
            onClick={submit}
            disabled={!allAnswered || loading}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold px-6 py-2.5 rounded-xl text-sm"
          >
            {loading ? "กำลังตรวจ…" : "ส่งคำตอบ (ส่งได้ครั้งเดียว)"}
          </button>
        ) : (
          <div className="font-bold text-lg">
            คะแนน: {score} / {total}{" "}
            {score === total ? "🎉 เยี่ยมมาก!" : score >= total / 2 ? "👍 ดีมาก" : "💪 ลองทบทวนเนื้อหาอีกครั้ง"}
            <span className="block text-xs font-normal text-slate-400 mt-1">
              บันทึกคะแนนแล้ว — แบบทดสอบนี้ทำได้ครั้งเดียว
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
