"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Markdown from "./Markdown";
import CodeEditor from "./CodeEditor";
import { usePyRunner, type TestResult } from "./usePyRunner";

const BlocklyEditor = dynamic(() => import("./BlocklyEditor"), {
  ssr: false,
  loading: () => (
    <div className="h-[380px] flex items-center justify-center text-slate-400">
      กำลังโหลดบล็อก…
    </div>
  ),
});

type Test = { id: number; input: string; expected_output: string; hidden: number };
type ProblemData = {
  id: number;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  starter_code: string;
};

export const DIFF_LABEL: Record<string, { text: string; cls: string }> = {
  easy: { text: "ง่าย", cls: "bg-green-100 text-green-700" },
  medium: { text: "ปานกลาง", cls: "bg-amber-100 text-amber-700" },
  hard: { text: "ยาก", cls: "bg-rose-100 text-rose-700" },
};

export default function ProblemWorkspace({
  problem,
  tests,
  alreadySolved,
  initialCode,
  initialMode,
  saveDraft = false,
}: {
  problem: ProblemData;
  tests: Test[];
  alreadySolved: boolean;
  initialCode?: string | null;
  initialMode?: string;
  saveDraft?: boolean;
}) {
  const router = useRouter();
  const { status, runTests, runOnce } = usePyRunner();
  const [mode, setMode] = useState<"code" | "blocks">(initialMode === "blocks" ? "blocks" : "code");
  const [mobileTab, setMobileTab] = useState<"desc" | "editor">("desc");
  const [code, setCode] = useState(initialCode ?? problem.starter_code);
  const [blockCode, setBlockCode] = useState("");
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [freeInput, setFreeInput] = useState("");
  const [freeOutput, setFreeOutput] = useState<{ output: string; error: string | null } | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [solved, setSolved] = useState(alreadySolved);
  const [submitting, setSubmitting] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  const activeCode = mode === "blocks" ? blockCode : code;
  const visibleTests = useMemo(() => tests.filter((t) => !t.hidden), [tests]);
  const busy = status !== "ready";

  // autosave โค้ดที่เขียน (เฉพาะโหมดเขียนโค้ด) แบบหน่วงเวลา
  const skipFirstSave = useRef(true);
  useEffect(() => {
    if (!saveDraft || mode !== "code") return;
    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      return;
    }
    setSaveState("saving");
    const t = setTimeout(async () => {
      try {
        await fetch("/api/drafts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ problemId: problem.id, code, mode }),
        });
        setSaveState("saved");
      } catch {
        setSaveState("idle");
      }
    }, 800);
    return () => clearTimeout(t);
  }, [code, mode, problem.id, saveDraft]);

  async function handleRunTests() {
    setRunError(null);
    setFreeOutput(null);
    setResults(null);
    try {
      const r = await runTests(
        activeCode,
        tests.map((t) => ({ input: t.input, expected: t.expected_output }))
      );
      setResults(r);
      const passed = r.filter((x) => x.passed).length;
      // บันทึกการส่ง
      setSubmitting(true);
      const resp = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: problem.id,
          code: activeCode,
          mode,
          passed,
          total: tests.length,
        }),
      });
      const data = await resp.json();
      if (data.success) setSolved(true);
      // ล้าง Router Cache เพื่อให้หน้ารายการโจทย์แสดงสถานะ "ผ่านแล้ว/ลองแล้ว" ที่อัปเดตแล้ว
      router.refresh();
    } catch (e) {
      setRunError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFreeRun() {
    setRunError(null);
    setResults(null);
    setFreeOutput(null);
    try {
      const r = await runOnce(activeCode, freeInput);
      setFreeOutput(r);
    } catch (e) {
      setRunError(e instanceof Error ? e.message : String(e));
    }
  }

  const passedCount = results ? results.filter((r) => r.passed).length : 0;
  const diff = DIFF_LABEL[problem.difficulty];

  return (
    <div>
      {/* หัวข้อ */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <h1 className="text-xl font-bold">{problem.title}</h1>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${diff.cls}`}>{diff.text}</span>
        {solved && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
            ✓ ผ่านแล้ว
          </span>
        )}
        <span className="ml-auto text-xs text-slate-400">
          {status === "loading" && "⏳ กำลังโหลด Python…"}
          {status === "running" && "▶️ กำลังรัน…"}
          {status === "ready" && "🟢 Python พร้อม"}
        </span>
      </div>

      {/* แท็บบนมือถือ: สลับ โจทย์/โค้ด */}
      <div className="lg:hidden flex rounded-xl bg-slate-200 p-1 mb-3">
        {([["desc", "📋 โจทย์"], ["editor", "💻 เขียนคำตอบ"]] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setMobileTab(k)}
            className={`flex-1 py-1.5 rounded-lg text-sm font-medium ${
              mobileTab === k ? "bg-white shadow text-indigo-700" : "text-slate-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:gap-5 items-start">
        {/* ฝั่งโจทย์ */}
        <div className={`${mobileTab === "desc" ? "block" : "hidden"} lg:block bg-white rounded-2xl border border-slate-200 p-4 mb-4 lg:mb-0`}>
          <Markdown>{problem.description}</Markdown>
          {visibleTests.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold text-sm mb-2">เทสเคสตัวอย่าง</h3>
              <div className="space-y-2">
                {visibleTests.map((t, i) => (
                  <div key={t.id} className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                      <div className="text-slate-400 mb-1">Input #{i + 1}</div>
                      <pre className="whitespace-pre-wrap font-mono">{t.input || "(ไม่มี)"}</pre>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                      <div className="text-slate-400 mb-1">Output</div>
                      <pre className="whitespace-pre-wrap font-mono">{t.expected_output}</pre>
                    </div>
                  </div>
                ))}
              </div>
              {tests.length > visibleTests.length && (
                <p className="text-xs text-slate-400 mt-2">
                  + เทสเคสลับอีก {tests.length - visibleTests.length} ชุด ใช้ตรวจตอนส่งคำตอบ
                </p>
              )}
            </div>
          )}
        </div>

        {/* ฝั่งเขียนคำตอบ */}
        <div className={`${mobileTab === "editor" ? "block" : "hidden"} lg:block space-y-3`}>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center border-b border-slate-200 px-2 pt-2 gap-1">
              {([["code", "⌨️ เขียนโค้ด"], ["blocks", "🧩 ลากบล็อก"]] as const).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setMode(k)}
                  className={`px-3 py-1.5 rounded-t-lg text-sm font-medium ${
                    mode === k
                      ? "bg-indigo-50 text-indigo-700 border border-b-0 border-slate-200"
                      : "text-slate-500"
                  }`}
                >
                  {label}
                </button>
              ))}
              {saveDraft && mode === "code" && (
                <span className="ml-auto pr-2 text-xs text-slate-400">
                  {saveState === "saving" && "💾 กำลังบันทึก…"}
                  {saveState === "saved" && "✓ บันทึกโค้ดแล้ว"}
                </span>
              )}
            </div>

            {mode === "code" ? (
              <CodeEditor value={code} onChange={setCode} height="320px" />
            ) : (
              <div>
                <div className="h-[380px]">
                  <BlocklyEditor
                    storageKey={`blockly-problem-${problem.id}`}
                    onCodeChange={setBlockCode}
                  />
                </div>
                <div className="border-t border-slate-200 bg-slate-900 text-slate-100 text-xs font-mono p-3 max-h-32 overflow-auto">
                  <div className="text-slate-400 mb-1"># โค้ด Python ที่ได้จากบล็อก</div>
                  <pre className="whitespace-pre-wrap">{blockCode || "(ยังไม่มีบล็อก)"}</pre>
                </div>
              </div>
            )}
          </div>

          {/* ปุ่มรัน */}
          <div className="flex gap-2">
            <button
              onClick={handleRunTests}
              disabled={busy || submitting}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold py-2.5 rounded-xl text-sm"
            >
              {busy ? "กำลังทำงาน…" : "🚀 ส่งคำตอบ (ตรวจทุกเทสเคส)"}
            </button>
          </div>

          {/* ลองรันเอง */}
          <details className="bg-white rounded-2xl border border-slate-200 p-3">
            <summary className="text-sm font-medium text-slate-600 cursor-pointer">
              🧪 ลองรันด้วย input ของเราเอง
            </summary>
            <div className="mt-2 space-y-2">
              <textarea
                value={freeInput}
                onChange={(e) => setFreeInput(e.target.value)}
                placeholder={"พิมพ์ input ที่นี่ (บรรทัดละค่า)"}
                className="w-full border border-slate-200 rounded-lg p-2 text-sm font-mono h-20"
              />
              <button
                onClick={handleFreeRun}
                disabled={busy}
                className="bg-slate-700 hover:bg-slate-800 disabled:bg-slate-300 text-white text-sm font-medium px-4 py-2 rounded-lg"
              >
                ▶ รัน
              </button>
              {freeOutput && (
                <pre
                  className={`text-xs font-mono p-3 rounded-lg whitespace-pre-wrap ${
                    freeOutput.error ? "bg-rose-50 text-rose-700" : "bg-slate-900 text-green-300"
                  }`}
                >
                  {freeOutput.error || freeOutput.output || "(ไม่มี output)"}
                </pre>
              )}
            </div>
          </details>

          {runError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl p-3">
              ⚠️ {runError}
            </div>
          )}

          {/* ผลเทสเคส */}
          {results && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <div
                className={`font-bold mb-3 ${
                  passedCount === results.length ? "text-green-600" : "text-slate-700"
                }`}
              >
                {passedCount === results.length
                  ? `🎉 ผ่านครบ ${results.length} เทสเคส!`
                  : `ผ่าน ${passedCount} / ${results.length} เทสเคส`}
              </div>
              <div className="space-y-2">
                {results.map((r, i) => {
                  const t = tests[i];
                  const isHidden = !!t.hidden;
                  return (
                    <div
                      key={i}
                      className={`rounded-lg border p-2 text-xs ${
                        r.passed ? "border-green-200 bg-green-50" : "border-rose-200 bg-rose-50"
                      }`}
                    >
                      <div className="font-medium">
                        {r.passed ? "✅" : "❌"} เทสเคส {i + 1} {isHidden && "(ลับ)"}
                      </div>
                      {!r.passed && !isHidden && (
                        <div className="mt-1 grid sm:grid-cols-2 gap-2 font-mono">
                          <div>
                            <div className="text-slate-400">ผลที่ต้องการ</div>
                            <pre className="whitespace-pre-wrap">{t.expected_output}</pre>
                          </div>
                          <div>
                            <div className="text-slate-400">ผลของคุณ</div>
                            <pre className="whitespace-pre-wrap">{r.error || r.output || "(ว่าง)"}</pre>
                          </div>
                        </div>
                      )}
                      {!r.passed && isHidden && r.error && (
                        <pre className="mt-1 whitespace-pre-wrap font-mono text-rose-600">{r.error}</pre>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
