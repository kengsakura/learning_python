import Link from "next/link";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.role !== "teacher") redirect("/learn");

  const d = db();
  const count = (sql: string) => (d.prepare(sql).get() as { c: number }).c;
  const stats = [
    { label: "นักเรียน", value: count("SELECT COUNT(*) c FROM users WHERE role='student'"), href: "/admin/students", icon: "👩‍🎓" },
    { label: "บทเรียน", value: count("SELECT COUNT(*) c FROM lessons"), href: "/admin/lessons", icon: "📘" },
    { label: "โจทย์", value: count("SELECT COUNT(*) c FROM problems"), href: "/admin/problems", icon: "🏆" },
    { label: "การส่งคำตอบ", value: count("SELECT COUNT(*) c FROM submissions"), href: "/admin/students", icon: "📨" },
  ];

  const recent = d
    .prepare(
      `SELECT sub.created_at, sub.passed, sub.total, sub.success, sub.mode,
              u.name AS student, p.title AS problem
       FROM submissions sub
       JOIN users u ON u.id = sub.user_id
       JOIN problems p ON p.id = sub.problem_id
       ORDER BY sub.id DESC LIMIT 10`
    )
    .all() as {
    created_at: string; passed: number; total: number; success: number; mode: string;
    student: string; problem: string;
  }[];

  return (
    <AppShell session={s} active="/admin">
      <h1 className="text-xl font-bold mb-4">📊 ภาพรวมระบบ</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {stats.map((st) => (
          <Link
            key={st.label}
            href={st.href}
            className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-indigo-300"
          >
            <div className="text-2xl">{st.icon}</div>
            <div className="text-2xl font-bold mt-1">{st.value}</div>
            <div className="text-xs text-slate-500">{st.label}</div>
          </Link>
        ))}
      </div>

      <h2 className="font-bold mb-2">การส่งคำตอบล่าสุด</h2>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {recent.length === 0 && <p className="p-4 text-sm text-slate-400">ยังไม่มีการส่งคำตอบ</p>}
        {recent.map((r, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 last:border-0 text-sm"
          >
            <span>{r.success ? "✅" : "❌"}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate">
                <span className="font-medium">{r.student}</span>
                <span className="text-slate-400"> — {r.problem}</span>
              </div>
              <div className="text-xs text-slate-400">
                ผ่าน {r.passed}/{r.total} · {r.mode === "blocks" ? "🧩 บล็อก" : "⌨️ โค้ด"} · {r.created_at}
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
