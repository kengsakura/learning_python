"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${tab}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "เกิดข้อผิดพลาด");
        return;
      }
      router.push(data.role === "teacher" ? "/admin" : "/learn");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-white to-emerald-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🐍</div>
          <h1 className="text-2xl font-bold text-indigo-700">PyLearn</h1>
          <p className="text-slate-500 text-sm">เรียน Python สนุก ๆ ทั้งเขียนโค้ดและต่อบล็อก</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-5">
          <div className="flex rounded-xl bg-slate-100 p-1 mb-4">
            {([["login", "เข้าสู่ระบบ"], ["register", "สมัครนักเรียนใหม่"]] as const).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setTab(k);
                  setError("");
                }}
                className={`flex-1 py-1.5 rounded-lg text-sm font-medium ${
                  tab === k ? "bg-white shadow text-indigo-700" : "text-slate-500"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            {tab === "register" && (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ชื่อที่แสดง เช่น เด็กหญิงมะลิ"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-indigo-400"
                required
              />
            )}
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ชื่อผู้ใช้ (username)"
              autoCapitalize="none"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-indigo-400"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="รหัสผ่าน"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-indigo-400"
              required
            />
            {error && <p className="text-sm text-rose-600">⚠️ {error}</p>}
            <button
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold py-2.5 rounded-xl"
            >
              {loading ? "กำลังดำเนินการ…" : tab === "login" ? "เข้าสู่ระบบ" : "สมัครและเริ่มเรียน"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
