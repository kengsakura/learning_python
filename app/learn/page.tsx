import Link from "next/link";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getSession } from "@/lib/auth";
import { listLessons, getProgress, getBestQuizScores } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function LearnPage() {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.role === "teacher") redirect("/admin");

  const lessons = listLessons();
  const done = getProgress(s.userId);
  const scores = getBestQuizScores(s.userId);
  const doneCount = lessons.filter((l) => done.has(l.id)).length;

  return (
    <AppShell session={s} active="/learn">
      <div className="mb-5">
        <h1 className="text-xl font-bold">สวัสดี {s.name} 👋</h1>
        <p className="text-sm text-slate-500">
          เรียนไปแล้ว {doneCount} จาก {lessons.length} บทเรียน
        </p>
        <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all"
            style={{ width: `${lessons.length ? (doneCount / lessons.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {lessons.map((l, i) => {
          const score = scores.get(l.id);
          return (
            <Link
              key={l.id}
              href={`/learn/${l.id}`}
              className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-indigo-300 hover:shadow-sm transition"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                    done.has(l.id) ? "bg-green-100 text-green-700" : "bg-indigo-100 text-indigo-700"
                  }`}
                >
                  {done.has(l.id) ? "✓" : i + 1}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold leading-snug">{l.title}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {score
                      ? `แบบทดสอบ: ${score.score}/${score.total} คะแนน`
                      : "ยังไม่ได้ทำแบบทดสอบ"}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
