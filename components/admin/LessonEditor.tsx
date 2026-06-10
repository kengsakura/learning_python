"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Markdown from "@/components/Markdown";

type QuestionDraft = {
  question: string;
  choices: string[];
  answer_index: number;
  explanation: string;
};

export default function LessonEditor({
  lesson,
  initialQuestions,
}: {
  lesson: { id: number; title: string; content: string; sort_order: number; published: number };
  initialQuestions: QuestionDraft[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(lesson.title);
  const [content, setContent] = useState(lesson.content);
  const [sortOrder, setSortOrder] = useState(lesson.sort_order);
  const [published, setPublished] = useState(!!lesson.published);
  const [questions, setQuestions] = useState<QuestionDraft[]>(initialQuestions);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  function updateQ(i: number, patch: Partial<QuestionDraft>) {
    setQuestions((qs) => qs.map((q, j) => (j === i ? { ...q, ...patch } : q)));
  }

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/lessons/${lesson.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, sort_order: sortOrder, published, questions }),
      });
      setMsg(res.ok ? "✅ บันทึกแล้ว" : "⚠️ บันทึกไม่สำเร็จ");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm(`ลบบทเรียน "${title}" และคำถามทั้งหมด?`)) return;
    await fetch(`/api/admin/lessons/${lesson.id}`, { method: "DELETE" });
    router.push("/admin/lessons");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="grid sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
          <label className="block">
            <span className="text-xs font-medium text-slate-500">ชื่อบทเรียน</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
            />
          </label>
          <label className="block w-24">
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
            <span className="text-xs font-medium text-slate-500">เนื้อหา (Markdown)</span>
            <button
              onClick={() => setPreview(!preview)}
              className="text-xs text-indigo-600 font-medium"
            >
              {preview ? "✏️ กลับไปแก้ไข" : "👁 ดูตัวอย่าง"}
            </button>
          </div>
          {preview ? (
            <div className="border border-slate-200 rounded-xl p-4 min-h-[300px]">
              <Markdown>{content}</Markdown>
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-3 text-sm font-mono min-h-[300px]"
            />
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold">แบบทดสอบท้ายบท ({questions.length} ข้อ)</h2>
          <button
            onClick={() =>
              setQuestions((qs) => [
                ...qs,
                { question: "", choices: ["", "", "", ""], answer_index: 0, explanation: "" },
              ])
            }
            className="text-sm text-indigo-600 font-medium"
          >
            + เพิ่มคำถาม
          </button>
        </div>

        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={i} className="border border-slate-200 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <span className="text-sm font-bold text-slate-400 mt-2">{i + 1}.</span>
                <div className="flex-1 space-y-2">
                  <input
                    value={q.question}
                    onChange={(e) => updateQ(i, { question: e.target.value })}
                    placeholder="คำถาม"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                  <div className="grid sm:grid-cols-2 gap-2">
                    {q.choices.map((c, ci) => (
                      <div key={ci} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`ans-${i}`}
                          checked={q.answer_index === ci}
                          onChange={() => updateQ(i, { answer_index: ci })}
                          className="accent-green-600 shrink-0"
                          title="ข้อนี้คือคำตอบที่ถูก"
                        />
                        <input
                          value={c}
                          onChange={(e) =>
                            updateQ(i, {
                              choices: q.choices.map((x, xi) => (xi === ci ? e.target.value : x)),
                            })
                          }
                          placeholder={`ตัวเลือก ${["ก", "ข", "ค", "ง"][ci]}`}
                          className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                  <input
                    value={q.explanation}
                    onChange={(e) => updateQ(i, { explanation: e.target.value })}
                    placeholder="คำอธิบายเฉลย (ไม่บังคับ)"
                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
                  />
                </div>
                <button
                  onClick={() => setQuestions((qs) => qs.filter((_, j) => j !== i))}
                  className="text-slate-400 hover:text-rose-600 p-1"
                  title="ลบคำถาม"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
          {questions.length === 0 && (
            <p className="text-sm text-slate-400">ยังไม่มีคำถาม กด &quot;+ เพิ่มคำถาม&quot; เพื่อเริ่ม</p>
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
          ลบบทเรียน
        </button>
        {msg && <span className="text-sm">{msg}</span>}
      </div>
    </div>
  );
}
