"use client";

import { useRef, useState } from "react";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";

// ปุ่มลัด: insert = ข้อความที่แทรก, caretBack = ถอยเคอร์เซอร์กี่ตำแหน่งหลังแทรก (สำหรับคู่วงเล็บ/quote)
type Key = { label: string; insert: string; caretBack?: number; wide?: boolean };

const SYMBOLS: Key[] = [
  { label: "Tab", insert: "    ", wide: true },
  { label: ":", insert: ":" },
  { label: "( )", insert: "()", caretBack: 1 },
  { label: "[ ]", insert: "[]", caretBack: 1 },
  { label: "{ }", insert: "{}", caretBack: 1 },
  { label: "' '", insert: "''", caretBack: 1 },
  { label: '" "', insert: '""', caretBack: 1 },
  { label: "=", insert: "=" },
  { label: "==", insert: "==" },
  { label: "<", insert: "<" },
  { label: ">", insert: ">" },
  { label: "+", insert: "+" },
  { label: "-", insert: "-" },
  { label: "*", insert: "*" },
  { label: "/", insert: "/" },
  { label: "%", insert: "%" },
  { label: ".", insert: "." },
  { label: ",", insert: "," },
  { label: "_", insert: "_" },
];

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

export default function CodeEditor({
  value,
  onChange,
  height = "300px",
}: {
  value: string;
  onChange: (v: string) => void;
  height?: string;
}) {
  const cmRef = useRef<ReactCodeMirrorRef>(null);
  const [showDigits, setShowDigits] = useState(false);

  function applyKey(k: Key) {
    const view = cmRef.current?.view;
    if (!view) return;
    const { from, to } = view.state.selection.main;

    if (k.caretBack && from !== to) {
      // มีการเลือกข้อความอยู่ → ครอบด้วยคู่วงเล็บ/quote
      const open = k.insert.slice(0, k.insert.length - k.caretBack);
      const close = k.insert.slice(k.insert.length - k.caretBack);
      const selected = view.state.sliceDoc(from, to);
      view.dispatch({
        changes: { from, to, insert: open + selected + close },
        selection: { anchor: from + open.length, head: from + open.length + selected.length },
        scrollIntoView: true,
      });
    } else {
      const anchor = from + k.insert.length - (k.caretBack ?? 0);
      view.dispatch({
        changes: { from, to, insert: k.insert },
        selection: { anchor },
        scrollIntoView: true,
      });
    }
    view.focus();
  }

  const btnCls =
    "shrink-0 min-w-9 px-2.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 font-mono text-sm active:bg-indigo-100 active:border-indigo-300";

  return (
    <div>
      <CodeMirror
        ref={cmRef}
        value={value}
        onChange={onChange}
        extensions={[python()]}
        height={height}
        basicSetup={{ lineNumbers: true, foldGutter: false, autocompletion: false }}
        style={{ fontSize: 14 }}
      />

      {/* แถบปุ่มลัด — ไม่ต้องสลับแป้นพิมพ์บนมือถือ */}
      <div className="border-t border-slate-200 bg-slate-50 p-1.5">
        <div className="flex gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setShowDigits((d) => !d)}
            onMouseDown={(e) => e.preventDefault()}
            className={`${btnCls} ${showDigits ? "bg-indigo-100 border-indigo-300" : ""}`}
            title="แสดง/ซ่อนแป้นตัวเลข"
          >
            123
          </button>
          {SYMBOLS.map((k) => (
            <button
              key={k.label}
              type="button"
              onClick={() => applyKey(k)}
              onMouseDown={(e) => e.preventDefault()}
              className={`${btnCls} ${k.wide ? "min-w-12 text-xs" : ""}`}
            >
              {k.label}
            </button>
          ))}
        </div>
        {showDigits && (
          <div className="flex gap-1 mt-1.5">
            {DIGITS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => applyKey({ label: d, insert: d })}
                onMouseDown={(e) => e.preventDefault()}
                className={`${btnCls} flex-1`}
              >
                {d}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
