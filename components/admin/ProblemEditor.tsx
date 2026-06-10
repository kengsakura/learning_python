"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Markdown from "@/components/Markdown";

type TestDraft = { input: string; expected_output: string; hidden: boolean };

export default function ProblemEditor({
  problem,
  initialTests,
}: {
  problem: {
    id: number;
    title: string;
    description: string;
    difficulty: string;
    starter_code: string;
    published: number;
    sort_order: number;
  };
  initialTests: TestDraft[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(problem.title);
  const [description, setDescription] = useState(problem.description);
  const [difficulty, setDifficulty] = useState(problem.difficulty);
  const [starterCode, setStarterCode] = useState(problem.starter_code);
  const [published, setPublished] = useState(!!problem.published);
  const [sortOrder, setSortOrder] = useState(problem.sort_order);
  const [tests, setTests] = useState<TestDraft[]>(initialTests);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  function updateT(i: number, patch: Partial<TestDraft>) {
    setTests((ts) => ts.map((t, j) => (j === i ? { ...t, ...patch } : t)));
  }

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/problems/${problem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          difficulty,
          starter_code: starterCode,
          published,
          sort_order: sortOrder,
          testCases: tests,
        }),
      });
      setMsg(res.ok ? "✅ บันทึกแล้ว" : "⚠️ บันทึกไม่สำเร็จ");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm(`ลบโจทย์ "${title}" และเทสเคสทั้งหมด?`)) return;
    await fetch(`/api/admin/problems/${problem.id}`, { method: "DELETE" });
    router.push("/admin/problems");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="grid sm:grid-cols-[1fr_auto_auto_auto] gap-3 items-end">
          <label className="block">
            <span className="text-xs font-medium text-slate-500">ชื่อโจทย์</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500">ระดับ</span>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
            >
              <option value="easy">ง่าย</option>
              <option value="medium">ปานกลาง</option>
              <option value="hard">ยาก</option>
            </select>
          </label>
          <label className="block w-20">
            <span className="text-xs font-medium text-slate-500">ลำดับ</span>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 pb-2 text-sm">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="w-4 h-4 accent-indigo-600"
            />
            เผยแพร่
          </label>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-500">คำอธิบายโจทย์ (Markdown)</span>
            <button onClick={() => setPreview(!preview)} className="text-xs text-indigo-600 font-medium">
              {preview ? "✏️ กลับไปแก้ไข" : "👁 ดูตัวอย่าง"}
            </button>
          </div>
          {preview ? (
            <div className="border border-slate-200 rounded-xl p-4 min-h-[200px]">
              <Markdown>{description}</Markdown>
            </div>
          ) : (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-3 text-sm font-mono min-h-[200px]"
            />
          )}
        </div>

        <label className="block">
          <span className="text-xs font-medium text-slate-500">โค้ดตั้งต้น (starter code)</span>
          <textarea
            value={starterCode}
            onChange={(e) => setStarterCode(e.target.value)}
            className="mt-1 w-full border border-slate-200 rounded-xl p-3 text-sm font-mono min-h-[100px]"
          />
        </label>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold">เทสเคส ({tests.length} ชุด)</h2>
          <button
            onClick={() => setTests((ts) => [...ts, { input: "", expected_output: "", hidden: false }])}
            className="text-sm text-indigo-600 font-medium"
          >
            + เพิ่มเทสเคส
          </button>
        </div>
        <div className="space-y-3">
          {tests.map((t, i) => (
            <div key={i} className="border border-slate-200 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-500">เทสเคส {i + 1}</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-slate-500">
                    <input
                      type="checkbox"
                      checked={t.hidden}
                      onChange={(e) => updateT(i, { hidden: e.target.checked })}
                      className="accent-indigo-600"
                    />
                    ซ่อนจากนักเรียน
                  </label>
                  <button
                    onClick={() => setTests((ts) => ts.filter((_, j) => j !== i))}
                    className="text-slate-400 hover:text-rose-600"
                    title="ลบเทสเคส"
                  >
                    🗑
                  </button>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-xs text-slate-400">Input (stdin)</span>
                  <textarea
                    value={t.input}
                    onChange={(e) => updateT(i, { input: e.target.value })}
                    className="mt-1 w-full border border-slate-200 rounded-lg p-2 text-sm font-mono h-20"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-slate-400">Output ที่ต้องการ</span>
                  <textarea
                    value={t.expected_output}
                    onChange={(e) => updateT(i, { expected_output: e.target.value })}
                    className="mt-1 w-full border border-slate-200 rounded-lg p-2 text-sm font-mono h-20"
                  />
                </label>
              </div>
            </div>
          ))}
          {tests.length === 0 && (
            <p className="text-sm text-slate-400">ยังไม่มีเทสเคส — โจทย์ต้องมีอย่างน้อย 1 ชุดจึงตรวจได้</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 sticky bottom-20 sm:bottom-4">
        <button
          onClick={save}
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold px-6 py-2.5 rounded-xl text-sm shadow-lg"
        >
          {saving ? "กำลังบันทึก…" : "💾 บันทึกทั้งหมด"}
        </button>
        <button onClick={remove} className="text-sm text-rose-600 font-medium px-3 py-2 bg-white rounded-xl border border-rose-200">
          ลบโจทย์
        </button>
        {msg && <span className="text-sm">{msg}</span>}
      </div>
    </div>
  );
}
