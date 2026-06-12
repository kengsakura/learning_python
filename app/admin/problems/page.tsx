import Link from "next/link";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import CreateButton from "@/components/admin/CreateButton";
import { getSession } from "@/lib/auth";
import { listProblems } from "@/lib/queries";
import { q } from "@/lib/db";

export const dynamic = "force-dynamic";

const DIFF_TEXT: Record<string, string> = { easy: "ง่าย", medium: "ปานกลาง", hard: "ยาก" };
const DIFF_BADGE: Record<string, string> = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-rose-100 text-rose-700",
};

export default async function AdminProblemsPage() {
  const s = await getSession();
  if (!s || s.role !== "teacher") redirect("/login");

  const problems = await listProblems(true);
  const tCount = await q<{ problem_id: number; c: number }>(
    "SELECT problem_id, COUNT(*) AS c FROM test_cases GROUP BY problem_id"
  );
  const tMap = new Map(tCount.map((r) => [Number(r.problem_id), Number(r.c)]));

  return (
    <AppShell session={s} active="/admin/problems">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">🏆 จัดการโจทย์</h1>
        <CreateButton endpoint="/api/admin/problems" redirectBase="/admin/problems" label="+ สร้างโจทย์" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {problems.map((p) => (
          <Link
            key={p.id}
            href={`/admin/problems/${p.id}`}
            className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50"
          >
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate">{p.title}</div>
              <div className="text-xs text-slate-400">เทสเคส {tMap.get(p.id) || 0} ชุด</div>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${DIFF_BADGE[p.difficulty]}`}>
              {DIFF_TEXT[p.difficulty]}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                p.published ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
              }`}
            >
              {p.published ? "เผยแพร่" : "ฉบับร่าง"}
            </span>
          </Link>
        ))}
        {problems.length === 0 && <p className="p-4 text-sm text-slate-400">ยังไม่มีโจทย์</p>}
      </div>
    </AppShell>
  );
}
