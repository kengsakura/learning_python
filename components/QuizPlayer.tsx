"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Q = { id: number; question: string; choices: string[] };
type GradeResult = {
  score: number;
  total: number;
  results: { id: number; correct: boolean; answerIndex: number; explanation: string }[];
};

export default function QuizPlayer({ lessonId, questions }: { lessonId: number; questions: Q[] }) {
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
      if (res.ok) {
        setGraded(await res.json());
        router.refresh(); // ล้างแคชเพื่อให้คะแนนควิซบนหน้าบทเรียนอัปเดต
      }
    } finally {
      setLoading(false);
    }
  }

  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
      <h2 className="font-bold text-lg mb-1">📝 แบบทดสอบท้ายบท</h2>
      <p className="text-sm text-slate-500 mb-4">{questions.length} ข้อ — เลือกคำตอบแล้วกดส่ง</p>

      <div className="space-y-5">
        {questions.map((q, qi) => {
          const result = graded?.results.find((r) => r.id === q.id);
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
                  if (graded && result) {
                    if (ci === result.answerIndex) cls = "border-green-400 bg-green-50 text-green-800";
                    else if (chosen && !result.correct) cls = "border-rose-400 bg-rose-50 text-rose-800";
                    else cls = "border-slate-200 bg-white opacity-60";
                  }
                  return (
                    <button
                      key={ci}
                      disabled={!!graded}
                      onClick={() => setAnswers((a) => ({ ...a, [q.id]: ci }))}
                      className={`text-left text-sm border rounded-xl px-3 py-2.5 ${cls}`}
                    >
                      {["ก", "ข", "ค", "ง"][ci] ? `${["ก", "ข", "ค", "ง"][ci]}. ${c}` : c}
                    </button>
                  );
                })}
              </div>
              {graded && result && (
                <div
                  className={`mt-2 text-sm rounded-lg px-3 py-2 ${
                    result.correct ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-800"
                  }`}
                >
                  {result.correct ? "✅ ถูกต้อง!" : "❌ ยังไม่ถูก"} {result.explanation && `— ${result.explanation}`}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5">
        {!graded ? (
          <button
            onClick={submit}
            disabled={!allAnswered || loading}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold px-6 py-2.5 rounded-xl text-sm"
          >
            {loading ? "กำลังตรวจ…" : "ส่งคำตอบ"}
          </button>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="font-bold text-lg">
              คะแนน: {graded.score} / {graded.total}{" "}
              {graded.score === graded.total ? "🎉 เยี่ยมมาก!" : graded.score >= graded.total / 2 ? "👍 ดีมาก" : "💪 ลองทบทวนอีกครั้ง"}
            </div>
            <button
              onClick={() => {
                setGraded(null);
                setAnswers({});
              }}
              className="text-sm text-indigo-600 font-medium hover:underline"
            >
              ทำใหม่อีกครั้ง
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
