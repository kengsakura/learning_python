import Link from "next/link";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import CreateButton from "@/components/admin/CreateButton";
import { getSession } from "@/lib/auth";
import { listLessons } from "@/lib/queries";
import { q } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminLessonsPage() {
  const s = await getSession();
  if (!s || s.role !== "teacher") redirect("/login");

  const lessons = await listLessons(true);
  const qCount = await q<{ lesson_id: number; c: number }>(
    "SELECT lesson_id, COUNT(*) AS c FROM quiz_questions GROUP BY lesson_id"
  );
  const qMap = new Map(qCount.map((r) => [Number(r.lesson_id), Number(r.c)]));

  return (
    <AppShell session={s} active="/admin/lessons">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">📘 จัดการบทเรียน</h1>
        <CreateButton endpoint="/api/admin/lessons" redirectBase="/admin/lessons" label="+ สร้างบทเรียน" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {lessons.map((l, i) => (
          <Link
            key={l.id}
            href={`/admin/lessons/${l.id}`}
            prefetch={false}
            className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50"
          >
            <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 text-sm font-bold flex items-center justify-center shrink-0">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate">{l.title}</div>
              <div className="text-xs text-slate-400">คำถาม {qMap.get(l.id) || 0} ข้อ</div>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                l.published ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
              }`}
            >
              {l.published ? "เผยแพร่" : "ฉบับร่าง"}
            </span>
          </Link>
        ))}
        {lessons.length === 0 && <p className="p-4 text-sm text-slate-400">ยังไม่มีบทเรียน</p>}
      </div>
    </AppShell>
  );
}
