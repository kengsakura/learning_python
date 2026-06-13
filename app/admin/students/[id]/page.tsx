import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getSession } from "@/lib/auth";
import { q, qOne } from "@/lib/db";

export const dynamic = "force-dynamic";

const DIFF_TEXT: Record<string, string> = { easy: "ง่าย", medium: "ปานกลาง", hard: "ยาก" };
const DIFF_BADGE: Record<string, string> = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-rose-100 text-rose-700",
};

type Sub = {
  id: number;
  problem_id: number;
  code: string;
  mode: string;
  passed: number;
  total: number;
  success: number;
  created_at: string;
  title: string;
  difficulty: string;
};

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const s = await getSession();
  if (!s || s.role !== "teacher") redirect("/login");

  const { id } = await params;
  const userId = Number(id);
  const student = await qOne<{ id: number; name: string; username: string; created_at: string }>(
    "SELECT id, name, username, created_at FROM users WHERE id = ? AND role = 'student'",
    [userId]
  );
  if (!student) notFound();

  // การส่งคำตอบทั้งหมด เรียงใหม่ไปเก่า เพื่อสรุปต่อโจทย์ในฝั่ง JS (ปลอดภัยทุก dialect)
  const subs = await q<Sub>(
    `SELECT sub.id, sub.problem_id, sub.code, sub.mode, sub.passed, sub.total, sub.success,
            sub.created_at, p.title, p.difficulty
     FROM submissions sub JOIN problems p ON p.id = sub.problem_id
     WHERE sub.user_id = ? ORDER BY sub.id DESC`,
    [userId]
  );

  type ProblemAgg = {
    problemId: number;
    title: string;
    difficulty: string;
    attempts: number;
    bestPassed: number;
    total: number;
    solved: boolean;
    latest: Sub;
    bestCodeSub: Sub; // โค้ดที่ผ่าน (ถ้ามี) ไม่งั้นล่าสุด
  };
  const byProblem = new Map<number, ProblemAgg>();
  for (const sub of subs) {
    const cur = byProblem.get(sub.problem_id);
    if (!cur) {
      byProblem.set(sub.problem_id, {
        problemId: sub.problem_id,
        title: sub.title,
        difficulty: sub.difficulty,
        attempts: 1,
        bestPassed: Number(sub.passed),
        total: Number(sub.total),
        solved: Number(sub.success) === 1,
        latest: sub, // ตัวแรกที่เจอคือล่าสุด (เรียง id DESC)
        bestCodeSub: sub,
      });
    } else {
      cur.attempts += 1;
      cur.bestPassed = Math.max(cur.bestPassed, Number(sub.passed));
      if (Number(sub.success) === 1) cur.solved = true;
      // เก็บโค้ดที่ผ่านล่าสุดเป็นตัวอย่างที่ดีที่สุด
      if (Number(sub.success) === 1 && Number(cur.bestCodeSub.success) !== 1) {
        cur.bestCodeSub = sub;
      }
    }
  }
  const problems = [...byProblem.values()];
  const solvedCount = problems.filter((p) => p.solved).length;

  // บทเรียน: เรียนจบหรือยัง + คะแนนควิซดีสุด
  const lessons = await q<{ id: number; title: string; done: number | null; best_quiz: number | null }>(
    `SELECT l.id, l.title,
       (SELECT 1 FROM lesson_progress lp WHERE lp.user_id = ? AND lp.lesson_id = l.id) AS done,
       (SELECT MAX(score * 100.0 / total) FROM quiz_attempts qa WHERE qa.user_id = ? AND qa.lesson_id = l.id) AS best_quiz
     FROM lessons l WHERE l.published = 1 ORDER BY l.sort_order, l.id`,
    [userId, userId]
  );
  const lessonsDone = lessons.filter((l) => l.done).length;

  return (
    <AppShell session={s} active="/admin/students">
      <div className="mb-3">
        <Link href="/admin/students" className="text-sm text-indigo-600 hover:underline">
          ← นักเรียนทั้งหมด
        </Link>
      </div>

      <h1 className="text-xl font-bold">{student.name}</h1>
      <p className="text-sm text-slate-400 mb-4">@{student.username} · สมัครเมื่อ {student.created_at}</p>

      {/* สรุป */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold">{lessonsDone}/{lessons.length}</div>
          <div className="text-xs text-slate-500">บทเรียนที่จบ</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold">{solvedCount}</div>
          <div className="text-xs text-slate-500">โจทย์ที่ผ่าน</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold">{subs.length}</div>
          <div className="text-xs text-slate-500">ส่งคำตอบรวม</div>
        </div>
      </div>

      {/* โจทย์ที่ลองทำ */}
      <h2 className="font-bold mb-2">🏆 โจทย์ที่ลองทำ ({problems.length} ข้อ)</h2>
      <div className="space-y-2 mb-6">
        {problems.length === 0 && (
          <p className="bg-white rounded-2xl border border-slate-200 p-4 text-sm text-slate-400">
            ยังไม่ได้ส่งคำตอบโจทย์ใด
          </p>
        )}
        {problems.map((p) => (
          <div key={p.problemId} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-2 flex-wrap p-3">
              <span>{p.solved ? "✅" : "✎"}</span>
              <Link href={`/problems/${p.problemId}`} className="font-medium hover:underline">
                {p.title}
              </Link>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${DIFF_BADGE[p.difficulty]}`}>
                {DIFF_TEXT[p.difficulty]}
              </span>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  p.solved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                }`}
              >
                {p.solved ? "ผ่านแล้ว" : "ยังไม่ผ่าน"}
              </span>
              <span className="ml-auto text-xs text-slate-400">
                ดีสุด {p.bestPassed}/{p.total} เทส · ส่ง {p.attempts} ครั้ง · {p.bestCodeSub.mode === "blocks" ? "🧩 บล็อก" : "⌨️ โค้ด"}
              </span>
            </div>
            <details className="border-t border-slate-100">
              <summary className="px-3 py-2 text-xs font-medium text-indigo-600 cursor-pointer">
                ดูโค้ด{p.solved ? "ที่ผ่าน" : "ล่าสุด"} ({p.bestCodeSub.created_at})
              </summary>
              <pre className="bg-slate-900 text-slate-100 text-xs font-mono p-3 overflow-x-auto whitespace-pre-wrap">
                {p.bestCodeSub.code || "(ว่าง)"}
              </pre>
            </details>
          </div>
        ))}
      </div>

      {/* บทเรียน */}
      <h2 className="font-bold mb-2">📘 บทเรียนและแบบทดสอบ</h2>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {lessons.map((l) => (
          <div
            key={l.id}
            className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 last:border-0 text-sm"
          >
            <span>{l.done ? "✅" : "⬜"}</span>
            <Link href={`/learn/${l.id}`} className="flex-1 min-w-0 truncate hover:underline">
              {l.title}
            </Link>
            <span className="text-xs text-slate-500 shrink-0">
              ควิซ {l.best_quiz != null ? `${Math.round(Number(l.best_quiz))}%` : "—"}
            </span>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
