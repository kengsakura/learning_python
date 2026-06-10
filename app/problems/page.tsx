import Link from "next/link";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getSession } from "@/lib/auth";
import { listProblems, getSolvedProblems } from "@/lib/queries";

export const dynamic = "force-dynamic";

const DIFFS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "easy", label: "ง่าย" },
  { key: "medium", label: "ปานกลาง" },
  { key: "hard", label: "ยาก" },
];
const DIFF_BADGE: Record<string, string> = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-rose-100 text-rose-700",
};
const DIFF_TEXT: Record<string, string> = { easy: "ง่าย", medium: "ปานกลาง", hard: "ยาก" };

export default async function ProblemsPage({
  searchParams,
}: {
  searchParams: Promise<{ diff?: string }>;
}) {
  const s = await getSession();
  if (!s) redirect("/login");

  const { diff = "all" } = await searchParams;
  const problems = listProblems().filter((p) => diff === "all" || p.difficulty === diff);
  const solved = s.role === "student" ? getSolvedProblems(s.userId) : new Set<number>();

  return (
    <AppShell session={s} active="/problems">
      <h1 className="text-xl font-bold mb-1">🏆 โจทย์ฝึกเขียนโปรแกรม</h1>
      <p className="text-sm text-slate-500 mb-4">
        เขียนโค้ดหรือต่อบล็อกให้ได้ output ตรงตามเทสเคส — ผ่านแล้ว {solved.size} ข้อ
      </p>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {DIFFS.map((d) => (
          <Link
            key={d.key}
            href={d.key === "all" ? "/problems" : `/problems?diff=${d.key}`}
            className={`shrink-0 text-sm font-medium px-3.5 py-1.5 rounded-full border ${
              diff === d.key
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
            }`}
          >
            {d.label}
          </Link>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {problems.map((p) => (
          <Link
            key={p.id}
            href={`/problems/${p.id}`}
            className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-indigo-300 hover:shadow-sm transition"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">{p.title}</span>
              {solved.has(p.id) && <span className="text-green-600 text-sm">✓</span>}
            </div>
            <div className="mt-2 flex gap-2">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${DIFF_BADGE[p.difficulty]}`}>
                {DIFF_TEXT[p.difficulty]}
              </span>
            </div>
          </Link>
        ))}
        {problems.length === 0 && (
          <p className="text-slate-400 text-sm col-span-full">ยังไม่มีโจทย์ในหมวดนี้</p>
        )}
      </div>
    </AppShell>
  );
}
