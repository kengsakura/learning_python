import Link from "next/link";
import type { Session } from "@/lib/auth";
import LogoutButton from "./LogoutButton";

const studentTabs = [
  { href: "/learn", label: "บทเรียน", icon: "📘" },
  { href: "/problems", label: "โจทย์ฝึก", icon: "🏆" },
];
const teacherTabs = [
  { href: "/admin", label: "ภาพรวม", icon: "📊" },
  { href: "/admin/lessons", label: "บทเรียน", icon: "📘" },
  { href: "/admin/problems", label: "โจทย์", icon: "🏆" },
  { href: "/admin/students", label: "นักเรียน", icon: "👩‍🎓" },
];

export default function AppShell({
  session,
  active,
  children,
}: {
  session: Session;
  active: string;
  children: React.ReactNode;
}) {
  const tabs = session.role === "teacher" ? teacherTabs : studentTabs;
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href={session.role === "teacher" ? "/admin" : "/learn"} className="font-bold text-indigo-600 text-lg shrink-0">
            🐍 PyLearn
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            {tabs.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                  active === t.href
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 min-w-0">
            <span className="text-sm text-slate-600 truncate">
              {session.role === "teacher" ? "👩‍🏫" : "👤"} {session.name}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-5 pb-24 sm:pb-8">
        {children}
      </main>

      {/* แถบเมนูล่างสำหรับมือถือ */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)]">
        <div className="flex">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium ${
                active === t.href ? "text-indigo-600" : "text-slate-500"
              }`}
            >
              <span className="text-lg leading-none">{t.icon}</span>
              {t.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
