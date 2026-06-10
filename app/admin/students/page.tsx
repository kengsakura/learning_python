import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminStudentsPage() {
  const s = await getSession();
  if (!s || s.role !== "teacher") redirect("/login");

  const d = db();
  const totals = {
    lessons: (d.prepare("SELECT COUNT(*) c FROM lessons WHERE published=1").get() as { c: number }).c,
    problems: (d.prepare("SELECT COUNT(*) c FROM problems WHERE published=1").get() as { c: number }).c,
  };

  const students = d
    .prepare(
      `SELECT u.id, u.name, u.username, u.created_at,
        (SELECT COUNT(*) FROM lesson_progress lp WHERE lp.user_id = u.id) AS lessons_done,
        (SELECT COUNT(DISTINCT problem_id) FROM submissions sub WHERE sub.user_id = u.id AND sub.success = 1) AS solved,
        (SELECT COUNT(*) FROM submissions sub WHERE sub.user_id = u.id) AS attempts,
        (SELECT MAX(score * 100.0 / total) FROM quiz_attempts qa WHERE qa.user_id = u.id) AS best_quiz
       FROM users u WHERE u.role = 'student' ORDER BY u.name`
    )
    .all() as {
    id: number; name: string; username: string; created_at: string;
    lessons_done: number; solved: number; attempts: number; best_quiz: number | null;
  }[];

  return (
    <AppShell session={s} active="/admin/students">
      <h1 className="text-xl font-bold mb-4">👩‍🎓 ความคืบหน้าของนักเรียน ({students.length} คน)</h1>

      {/* ตารางบน desktop / การ์ดบนมือถือ */}
      <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">นักเรียน</th>
              <th className="text-center px-3 py-2.5 font-medium">บทเรียนที่จบ</th>
              <th className="text-center px-3 py-2.5 font-medium">โจทย์ที่ผ่าน</th>
              <th className="text-center px-3 py-2.5 font-medium">ครั้งที่ส่ง</th>
              <th className="text-center px-3 py-2.5 font-medium">ควิซดีสุด</th>
            </tr>
          </thead>
          <tbody>
            {students.map((st) => (
              <tr key={st.id} className="border-t border-slate-100">
                <td className="px-4 py-2.5">
                  <div className="font-medium">{st.name}</div>
                  <div className="text-xs text-slate-400">@{st.username}</div>
                </td>
                <td className="text-center px-3 py-2.5">
                  {st.lessons_done}/{totals.lessons}
                </td>
                <td className="text-center px-3 py-2.5">
                  {st.solved}/{totals.problems}
                </td>
                <td className="text-center px-3 py-2.5">{st.attempts}</td>
                <td className="text-center px-3 py-2.5">
                  {st.best_quiz != null ? `${Math.round(st.best_quiz)}%` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {students.length === 0 && <p className="p-4 text-sm text-slate-400">ยังไม่มีนักเรียนสมัคร</p>}
      </div>

      <div className="sm:hidden space-y-3">
        {students.map((st) => (
          <div key={st.id} className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="font-medium">{st.name}</div>
            <div className="text-xs text-slate-400 mb-2">@{st.username}</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>📘 บทเรียน {st.lessons_done}/{totals.lessons}</div>
              <div>🏆 โจทย์ {st.solved}/{totals.problems}</div>
              <div>📨 ส่ง {st.attempts} ครั้ง</div>
              <div>📝 ควิซ {st.best_quiz != null ? `${Math.round(st.best_quiz)}%` : "—"}</div>
            </div>
          </div>
        ))}
        {students.length === 0 && <p className="text-sm text-slate-400">ยังไม่มีนักเรียนสมัคร</p>}
      </div>
    </AppShell>
  );
}
